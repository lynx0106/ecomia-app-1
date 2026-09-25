import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { decryptString } from '@/lib/crypto';
import {
  validateWebhookSignature,
  verifyPaymentWithApi,
  parseWebhookPayload,
  parseExternalReference,
} from '@/lib/mercadopago/webhook-validator';

type LandingPaymentRow = {
  id: string;
  content: Record<string, unknown> | null;
};

function tokenFromContent(content: Record<string, unknown> | null) {
  const payments = (content?.payments || {}) as Record<string, unknown>;
  const mp = (payments.mercadopago || {}) as Record<string, unknown>;
  return typeof mp.access_token_enc === 'string' ? mp.access_token_enc : '';
}

function decryptToken(payload: string) {
  try {
    return decryptString(payload);
  } catch {
    return '';
  }
}

async function loadLanding(supabase: ReturnType<typeof createServiceClient>, id: string) {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, content')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as LandingPaymentRow;
}

async function findLandingByCollector(supabase: ReturnType<typeof createServiceClient>, mpUserId: string) {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, content')
    .filter('content->payments->mercadopago->>user_id', 'eq', mpUserId)
    .limit(1);
  if (error || !data?.length) return null;
  return data[0] as LandingPaymentRow;
}

/**
 * El pago se verifica con el access token cifrado de la landing, no con el token de la plataforma.
 * Si payment_logs no se puede escribir, se responde 500 para que Mercado Pago reintente.
 */
export async function POST(request: NextRequest) {
  try {
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    if (!xSignature || !xRequestId) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
    }

    const rawBody = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const payload = parseWebhookPayload(body);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (payload.type !== 'payment') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const paymentId = String(payload.data.id);
    if (!validateWebhookSignature(xSignature, xRequestId, paymentId, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const landingIdQuery = request.nextUrl.searchParams.get('landing_id');
    let tokenLanding = landingIdQuery ? await loadLanding(supabase, landingIdQuery) : null;
    if (!tokenLanding && payload.user_id) {
      tokenLanding = await findLandingByCollector(supabase, String(payload.user_id));
    }
    if (!tokenLanding) {
      return NextResponse.json({ error: 'No se encontró la landing del pago' }, { status: 400 });
    }

    const lookupToken = decryptToken(tokenFromContent(tokenLanding.content));
    if (!lookupToken) {
      return NextResponse.json({ error: 'La landing no tiene un token de Mercado Pago usable' }, { status: 400 });
    }

    const lookedUp = await verifyPaymentWithApi(paymentId, lookupToken);
    if (!lookedUp.valid || !lookedUp.data) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const externalRef = lookedUp.data.external_reference as string;
    const parsedRef = parseExternalReference(externalRef || '');
    if (!parsedRef || parsedRef.type !== 'landing') {
      return NextResponse.json({ error: 'El pago no corresponde a una landing' }, { status: 400 });
    }

    const paidLanding = parsedRef.id === tokenLanding.id
      ? tokenLanding
      : await loadLanding(supabase, parsedRef.id);
    if (!paidLanding) {
      return NextResponse.json({ error: 'Landing del pago no encontrada' }, { status: 400 });
    }

    let paymentData = lookedUp.data;
    if (paidLanding.id !== tokenLanding.id) {
      const landingToken = decryptToken(tokenFromContent(paidLanding.content));
      if (!landingToken) {
        return NextResponse.json({ error: 'La landing del pago no tiene token' }, { status: 400 });
      }
      const verified = await verifyPaymentWithApi(paymentId, landingToken);
      if (!verified.valid || !verified.data) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
      paymentData = verified.data;
    }

    const logData = {
      mercadopago_id: paymentId,
      external_reference: externalRef,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_type: paymentData.payment_type_id,
      transaction_amount: paymentData.transaction_amount,
      currency_id: paymentData.currency_id,
      buyer_email: paymentData.payer?.email,
      webhook_data: paymentData,
      verified: true,
      verified_at: new Date().toISOString(),
      landing_id: paidLanding.id,
    };

    const { error: logError } = await supabase
      .from('payment_logs')
      .upsert(logData, { onConflict: 'mercadopago_id' });

    if (logError) {
      console.error('[Webhook] Error saving payment log:', logError);
      return NextResponse.json({ error: 'No se pudo registrar el pago' }, { status: 500 });
    }

    const currentContent = (paidLanding.content || {}) as Record<string, unknown>;
    const order = {
      status: paymentData.status === 'approved' ? 'paid' : paymentData.status,
      external_reference: externalRef,
      mercadopago_id: paymentId,
      amount: paymentData.transaction_amount,
      currency_id: paymentData.currency_id,
      paid_at: paymentData.status === 'approved' ? new Date().toISOString() : null,
    };

    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        content: {
          ...currentContent,
          order,
        },
      })
      .eq('id', paidLanding.id);

    if (updateError) {
      console.error('[Webhook] Error updating landing order:', updateError);
      return NextResponse.json({ error: 'No se pudo guardar el estado del pago' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      paymentId,
      status: order.status,
      processed: true,
    });
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'mercadopago-webhook',
    timestamp: new Date().toISOString(),
  });
}
