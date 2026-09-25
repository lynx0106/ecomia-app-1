# Arranque local

Node.js >= 20.9.

```bash
npm ci
cp .env.example .env.local
```

Completa `.env.local` fuera del git. `.env.example` solo tiene nombres.

## SQL que crea tablas

En el SQL Editor de Supabase, en este orden:

1. `database/migrations/` que crean tablas de verdad, en particular `20260213_user_allocated_searches.sql` y `20260216_add_payment_logs.sql`.
2. `DATABASE_PRODUCT_FLOW.sql`, que crea `research_sessions` y las tablas de la investigación.

`DATABASE_CONSTRAINTS.sql` no crea esas tablas: solo propone checks y un esbozo de RLS. No alcanza para levantar la app.

`landing_pages`, `stores` y `profiles` las usa el código y las referencian migraciones, pero este repo no trae un `CREATE TABLE` único para ellas. Si faltan en el proyecto, hay que crearlas antes de las migraciones que las referencian.

El chat escribe con la service role (`SUPABASE_SERVICE_ROLE_KEY`): la fila de cupo y el descuento de `used_count` no pasan por la policy de usuario.

```bash
npm run dev
```

La app queda en `http://localhost:3000`.
