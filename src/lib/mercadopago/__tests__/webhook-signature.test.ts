/**
 * @jest-environment node
 */
import { createHmac } from 'crypto';
import { validateWebhookSignature } from '@/lib/mercadopago/webhook-validator';

function signature(secret: string, paymentId: string, requestId: string, ts = '1700000000') {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${hash}`;
}

describe('firma del webhook de Mercado Pago', () => {
  it('acepta una firma válida sin llamar a la red', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const header = signature('webhook-secret', '987654', 'req-1');

    expect(validateWebhookSignature(header, 'req-1', '987654', 'webhook-secret')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('rechaza una firma alterada', () => {
    const header = signature('webhook-secret', '987654', 'req-1');
    expect(validateWebhookSignature(header, 'req-1', '111', 'webhook-secret')).toBe(false);
  });
});
