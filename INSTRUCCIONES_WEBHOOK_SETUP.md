# Webhook de Mercado Pago

El checkout crea la preferencia con el access token cifrado de esa landing (`content.payments.mercadopago.access_token_enc`). El webhook consulta `GET /v1/payments/{id}` con ese mismo token. No usa `MERCADOPAGO_ACCESS_TOKEN`.

URL a registrar en la aplicación de Mercado Pago del vendedor, o la que arma el checkout en `notification_url`:

`https://<tu-dominio>/api/webhooks/mercadopago`

El checkout añade `?landing_id=<uuid>` para saber qué token descifrar. La vuelta del comprador es `/l/[slug]`, sin login.

Variable del servidor: `MERCADOPAGO_WEBHOOK_SECRET` (la firma `x-signature`).

Si el insert en `payment_logs` falla, el endpoint responde 500 para que Mercado Pago reintente.

## Qué mira el operador

Cuando un pago queda `approved`:

- `payment_logs`, por `mercadopago_id` o por `external_reference` `landing:<uuid>`.
- En esa landing, `content.order.status` queda `paid` (con el mismo `external_reference`). No basta con `updated_at`.
