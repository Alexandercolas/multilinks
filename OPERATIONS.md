# Estado de publicación y correos

Revisión: 12 de octubre de 2026.

## Verificado

- Vercel: proyecto `multilinksrd`, despliegue Production Ready del commit `49875c0`.
- Dominio publicado: https://multilinksrd.vercel.app.
- Pro mensual: US$3.00 en aplicación, base de datos y catálogo activo de Lemon Squeezy.
- Trabajo automático `refresh-premium-access`: activo.
- Supabase Site URL corregido a `https://multilinksrd.vercel.app`.
- Añadidos los retornos exactos `/auth/callback`, `/auth/callback?next=/dashboard` y `/auth/callback?next=/reset-password` del dominio actual.
- Solicitud de correo de recuperación aceptada por Supabase; la entrega necesita confirmación del destinatario.

## Pendiente para correos de producción

El SMTP propio aún no está configurado. El envío predeterminado de Supabase tiene restricciones de destinatarios y no debe considerarse una solución de envío para los usuarios de producción.

Se propone Resend y el dominio elegido por el propietario, `multilinksrd.com`, disponible en la búsqueda de Vercel por US$11.25/año al momento de esta revisión. El propietario decidió posponer el registro del dominio; no se efectuó ninguna compra. Preparar el remitente `MultiLinks <no-reply@multilinksrd.com>` tras verificar el dominio; configurar SMTP en Supabase y comprobar confirmación de registro y recuperación en correo real. No guardar credenciales en el repositorio.

## Pendiente de pagos reales

La última revisión de Lemon Squeezy mostró la activación de tienda en revisión y Test mode activo. Tras la aprobación, configurar credenciales y variante del modo real, verificar el webhook y comprobar un pago de US$3 con activación automática. No considerar un checkout de prueba como un cobro real.

## Comprobación pública

`node scripts/check-production.mjs` revisa páginas públicas, precio y restricciones de acceso sin enviar correos ni efectuar pagos.

Referencias: [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [Resend con Supabase](https://resend.com/supabase).

## Indexación en Google

Se conserva el dominio actual de Vercel. Search Console verificó la propiedad de prefijo `https://multilinksrd.vercel.app/` mediante etiqueta HTML. Se reenvió `/sitemap.xml` el 12 de octubre de 2026 y Google confirmó el envío con éxito. Inspección de URLs confirmó que el inicio ya está indexado en Google. La solicitud manual de nuevo rastreo no se procesó porque Google indicó cuota diaria agotada; no se insistió ni se cambió de cuenta para evitar el límite. La etiqueta de la cuenta actual se añade sin eliminar la verificación anterior. La página `/planes` dispone de canonical propio. El sitemap pagina los perfiles públicos como visitante anónimo y usa sus fechas reales; incluye hasta 50.000 URLs por XML. Superado ese límite, implementar un índice de varios sitemaps. Google decide cuándo rastrear, indexar y posicionar; no existe una prioridad garantizada por robots ni por enviar el sitemap.

## Confirmación del registro

El registro permite reenviar el enlace después de 60 segundos y corregir el correo. El servidor limita el reenvío a tres solicitudes por hora para cada combinación de correo e IP y responde sin revelar si existe una cuenta. La confirmación de la solicitud no garantiza la entrega: SMTP sigue pendiente. Las pruebas de reenvío y de interfaz usan respuestas simuladas, sin enviar correos reales.
