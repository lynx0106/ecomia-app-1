# Guía corta del vendedor

1. Entra con tu correo en `/login`.
2. En `/chat` describe el producto. Al cerrar la investigación se guarda y descuenta un uso del cupo. Al cerrar la landing queda un borrador.
3. En `/landing/[id]` edita el precio en COP, pega el access token de tu Mercado Pago y publica.
4. Copia `/l/[slug]` y úsalo en el anuncio.

El comprador no inicia sesión. El dinero entra a tu Mercado Pago, no a una cuenta de la plataforma.

Si el cupo se acaba, un operador lo suma en `/admin/searches`. Cada investigación guardada cuenta como un uso, no cada mensaje del chat.
