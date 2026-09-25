# Ecom IA

Para quien vende una oferta física en Colombia y hoy junta un chat, una página y Mercado Pago a mano: Ecom IA investiga el producto en español con precios locales, publica una landing y cobra con Checkout Pro en la cuenta de Mercado Pago del vendedor.

País del primer cobro: Colombia, en COP. El modelo es xAI (`XAI_API_KEY`, `grok-4-1-fast-non-reasoning`). El flujo es uno: `/chat` → landing en borrador → `/l/[slug]`. El comprador no inicia sesión. La plataforma no se queda con el dinero de la venta.

Node.js >= 20.9. La sesión vive en `src/middleware.ts` (delega en `src/lib/supabase/middleware.ts`). `/l/` es pública. El resto del dashboard pide login.

La URL de producción la fija el dueño. En el repo conviven `ecom-ia.online`, `ecomia-app.online` y `ecomia.vercel.app`; ninguna queda declarada como canónica aquí.

## Variables

Nombres en [`.env.example`](./.env.example). Sin valores en el repositorio. El runtime lee `XAI_API_KEY`, `TAVILY_API_KEY`, `APP_ENCRYPTION_KEY`, `MERCADOPAGO_WEBHOOK_SECRET` y `NEXT_PUBLIC_SITE_URL`, además de Supabase. El pago del vendedor se verifica con el token cifrado de su landing, no con `MERCADOPAGO_ACCESS_TOKEN`.

## Operación

- Rotar claves si estuvieron en el árbol (anon de Supabase, Groq, Tavily). La URL de Supabase va ligada a ese proyecto.
- Cargar cupo en `/admin/searches`. El correo de superadmin es `SUPERADMIN_EMAIL`.
- Cuando un pago queda aprobado, la fila está en `payment_logs` y la landing guarda `content.order.status = paid`.

Arranque local: [SETUP_LOCAL.md](./SETUP_LOCAL.md). Webhook: [INSTRUCCIONES_WEBHOOK_SETUP.md](./INSTRUCCIONES_WEBHOOK_SETUP.md). Vendedor: [GUIA_DE_USUARIO.md](./GUIA_DE_USUARIO.md).
