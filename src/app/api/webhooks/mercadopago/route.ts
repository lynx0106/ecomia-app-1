import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  validateWebhookSignature,
  verifyPaymentWithApi,
  parseWebhookPayload,
  parseExternalReference,
} from '@/lib/mercadopago/webhook-validator';
import { auditPaymentEvent } from '@/lib/audit-logger';

/**
 * Webhook de MercadoPago para notificaciones de pago
 * 
 * Configurar en: https://www.mercadopago.com.co/developers/panel/app/{APP_ID}/webhooks
 * URL del webhook: https://ecomia-app.online/api/webhooks/mercadopago
 * 
 * Este endpoint:
 * 1. Valida la firma del webhook
 * 2. Verifica el pago contra la API de MercadoPago
 * 3. Guarda el log del pago en la base de datos
 * 4. Actualiza el estado en landing_pages o stores si aplica
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Webhook] Received payment notification');

    // 1. Obtener headers de validación de MercadoPago
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error('[Webhook] Missing required signature headers');
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 400 }
      );
    }

    // 2. Obtener el body RAW (necesario para validar la firma)
    const rawBody = await request.text();
    let body: any;
    
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[Webhook] Invalid JSON body');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // 3. Parsear y validar el payload
    const payload = parseWebhookPayload(body);
    if (!payload) {
      console.error('[Webhook] Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // 4. Solo procesar eventos de pago
    if (payload.type !== 'payment') {
      console.log('[Webhook] Ignoring non-payment event:', payload.type);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentId = payload.data.id;
    console.log('[Webhook] Processing payment ID:', paymentId);

    // 5. Validar firma del webhook
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] MERCADOPAGO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const isValidSignature = validateWebhookSignature(
      xSignature,
      xRequestId,
      paymentId,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error('[Webhook] Invalid signature for payment:', paymentId);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Webhook] Signature validated successfully');

    // 6. Obtener access token para verificar el pago
    // En producción, cada tienda/landing tiene su propio token
    // Por ahora usamos un token general para verificación
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('[Webhook] MERCADOPAGO_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 7. Verificar el pago directamente con la API de MercadoPago
    const { valid, data: paymentData } = await verifyPaymentWithApi(
      paymentId,
      accessToken
    );

    if (!valid || !paymentData) {
      console.error('[Webhook] Payment verification failed:', paymentId);
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log('[Webhook] Payment verified:', {
      id: paymentData.id,
      status: paymentData.status,
      amount: paymentData.transaction_amount,
    });

    // 8. Extraer external_reference
    const externalRef = paymentData.external_reference as string;
    if (!externalRef) {
      console.error('[Webhook] Missing external_reference in payment');
      return NextResponse.json(
        { error: 'Missing external_reference' },
        { status: 400 }
      );
    }

    const parsedRef = parseExternalReference(externalRef);
    if (!parsedRef) {
      console.error('[Webhook] Invalid external_reference format:', externalRef);
      return NextResponse.json(
        { error: 'Invalid external_reference' },
        { status: 400 }
      );
    }

    const { type, id: resourceId } = parsedRef;

    // 9. Conectar a Supabase y guardar log del pago
    const supabase = createServiceClient();

    const logData: any = {
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
    };

    // Asignar landing_id o store_id según el tipo
    if (type === 'landing') {
      logData.landing_id = resourceId;
    } else if (type === 'store') {
      logData.store_id = resourceId;
    }

    const { error: logError } = await supabase
      .from('payment_logs')
      .upsert(logData, { onConflict: 'mercadopago_id' });

    if (logError) {
      console.error('[Webhook] Error saving payment log:', logError);
      // No retornamos error porque el pago ya fue validado
      // El log es importante pero no crítico
    } else {
      console.log('[Webhook] Payment log saved successfully');
    }

    // 10. Si el pago fue aprobado, actualizar estado en el recurso y registrar en auditoría
    if (paymentData.status === 'approved') {
      console.log('[Webhook] Payment approved, updating resource status');

      // Registrar el pago en auditoría
      await auditPaymentEvent(
        '', // No tenemos user_id en webhook, es sistema
        paymentData.payer?.email || 'anonymous',
        'payment_completed',
        paymentId,
        paymentData.transaction_amount || 0,
        'success',
        {
          landing_id: type === 'landing' ? resourceId : undefined,
          store_id: type === 'store' ? resourceId : undefined,
          payment_type: paymentData.payment_type_id,
          currency: paymentData.currency_id,
        }
      );

      if (type === 'landing' && resourceId) {
        // Actualizar landing page con estado de pago
        const { error: updateError } = await supabase
          .from('landing_pages')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', resourceId);

        if (updateError) {
          console.error('[Webhook] Error updating landing:', updateError);
        } else {
          console.log('[Webhook] Landing page updated successfully');
        }
      } else if (type === 'store' && resourceId) {
        // Actualizar store con estado de pago
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', resourceId);

        if (updateError) {
          console.error('[Webhook] Error updating store:', updateError);
        } else {
          console.log('[Webhook] Store updated successfully');
        }
      }
    }

    console.log('[Webhook] Processing completed successfully');

    // Retornar respuesta exitosa
    return NextResponse.json({
      ok: true,
      paymentId,
      status: paymentData.status,
      processed: true,
    });

  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para health check del webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'mercadopago-webhook',
    timestamp: new Date().toISOString(),
  });
}
