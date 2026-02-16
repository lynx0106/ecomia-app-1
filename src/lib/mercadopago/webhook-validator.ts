import { createHmac, timingSafeEqual } from 'crypto';

interface WebhookPayload {
  id: string;
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  live_mode: boolean;
  type: string;
  user_id: string;
}

/**
 * Valida la firma del webhook de MercadoPago
 * Documentación: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 * 
 * @param xSignature - Header x-signature del webhook
 * @param xRequestId - Header x-request-id del webhook
 * @param rawBody - Body RAW del request (payment ID)
 * @param secret - Secret del webhook configurado en MercadoPago
 * @returns true si la firma es válida, false en caso contrario
 */
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  rawBody: string,
  secret: string
): boolean {
  try {
    // Extraer ts y hash de x-signature
    // Formato: "ts=1234567890,v1=hash"
    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !hash) {
      console.error('[Webhook] Missing ts or hash in x-signature');
      return false;
    }

    // Construir el string a validar según documentación de MercadoPago
    // Formato: id;request-id;ts
    const manifest = `id:${rawBody};request-id:${xRequestId};ts:${ts};`;

    // Generar HMAC SHA256
    const hmac = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    // Comparar hashes (constant-time comparison para seguridad)
    const isValid = timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isValid) {
      console.error('[Webhook] Signature mismatch', {
        expected: hash,
        received: hmac.substring(0, 10) + '...',
      });
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook] Validation error:', error);
    return false;
  }
}

/**
 * Verifica el pago directamente en la API de MercadoPago
 * Esto es una doble verificación para asegurar que el pago es legítimo
 * 
 * @param paymentId - ID del pago en MercadoPago
 * @param accessToken - Access token de MercadoPago
 * @returns Objeto con valid (boolean) y data (payment info)
 */
export async function verifyPaymentWithApi(
  paymentId: string,
  accessToken: string
): Promise<{ valid: boolean; data: any }> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Webhook] API verification failed:', {
        status: response.status,
        statusText: response.statusText,
      });
      return { valid: false, data: null };
    }

    const data = await response.json();
    
    // Validar que el pago tenga la estructura esperada
    if (!data.id || !data.status) {
      console.error('[Webhook] Invalid payment data structure');
      return { valid: false, data: null };
    }

    console.log('[Webhook] Payment verified successfully:', {
      id: data.id,
      status: data.status,
      amount: data.transaction_amount,
    });

    return { valid: true, data };
  } catch (error) {
    console.error('[Webhook] API verification error:', error);
    return { valid: false, data: null };
  }
}

/**
 * Parsea y valida el payload del webhook
 * 
 * @param body - Body del webhook
 * @returns Payload parseado o null si es inválido
 */
export function parseWebhookPayload(body: any): WebhookPayload | null {
  try {
    // Validar estructura básica
    if (!body.data?.id || !body.type) {
      console.error('[Webhook] Invalid payload structure', {
        hasData: !!body.data,
        hasType: !!body.type,
      });
      return null;
    }

    return body as WebhookPayload;
  } catch (error) {
    console.error('[Webhook] Parse error:', error);
    return null;
  }
}

/**
 * Extrae información del external_reference
 * Formato esperado: "landing:uuid" o "store:uuid"
 * 
 * @param externalRef - External reference del pago
 * @returns Objeto con type y id, o null si es inválido
 */
export function parseExternalReference(
  externalRef: string
): { type: 'landing' | 'store'; id: string } | null {
  if (!externalRef || typeof externalRef !== 'string') {
    return null;
  }

  const parts = externalRef.split(':');
  if (parts.length !== 2) {
    console.error('[Webhook] Invalid external_reference format:', externalRef);
    return null;
  }

  const [type, id] = parts;

  if (type !== 'landing' && type !== 'store') {
    console.error('[Webhook] Invalid resource type:', type);
    return null;
  }

  // Validar que el ID sea un UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('[Webhook] Invalid UUID in external_reference:', id);
    return null;
  }

  return { type, id };
}
