# Free, Premium y prueba de 30 días

La identidad y el catálogo siguen en Supabase (`auth.users`, `subscriptions`, `plans`). Se conserva Lemon Squeezy como proveedor de pago y la clave interna `pro`; el nombre comercial es Premium, US$3.50/mes. No se inicia un cobro por registrarse.

## Acceso y contenido

`account_access()` calcula el acceso, las fechas, los días restantes y los permisos en PostgreSQL. El navegador consume esa respuesta; no interpreta pagos ni decide la expiración. El registro crea 30 días completos de Premium sin tarjeta. Las cuentas existentes conservan solamente el tiempo restante desde su registro original. Los administradores y las asignaciones Premium manuales anteriores se respetan.

Free publica un enlace: el primero activo por posición, creación e ID. Los demás siguen guardados, incluida su intención de publicación. RLS y las funciones de clics, destinos públicos e impresiones impiden publicar o medir enlaces bloqueados mediante peticiones directas. El perfil público aplica las mismas condiciones a fondos, portada, temas, Smart Media y marca. Las modificaciones de personalización y las nuevas subidas Premium requieren permisos de backend.

Al expirar, no se borran enlaces, archivos, ajustes ni estadísticas. Reactivar Premium vuelve a mostrar los enlaces que el propietario dejó activos; los desactivados manualmente siguen desactivados. La migración no puede reconstruir intenciones que hubiera eliminado el antiguo trabajo de desactivación antes de esta actualización.

`refresh_expired_access()` actualiza estados y auditoría cada 15 minutos con pg_cron. Las comprobaciones de acceso evalúan las fechas en cada solicitud y no dependen de que el trabajo haya ejecutado. Una cancelación mantiene acceso hasta `ends_at`. Un pago pendiente tiene una gracia máxima de 14 días desde el primer estado `past_due`; renovar restablece acceso. La prueba local conserva su fecha original incluso si se contrata o cancela una suscripción.

## Cobros

Configurar en el servidor y en Vercel, sin publicar valores:

- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`: origen público del proyecto.
- `LEMONSQUEEZY_TEST_MODE=true` únicamente para pruebas con recursos de prueba.
- `LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID` opcional: muestra la oferta anual existente de US$39.99 si está configurada.

La variante mensual debe ser una suscripción estándar mensual, USD, sin cuota inicial ni facturación por uso. El servidor verifica el producto y establece el precio desde `plans` mediante `custom_price`, que también se aplica a renovaciones. `skip_trial` evita crear una segunda prueba del proveedor después de la prueba local. El checkout muestra los impuestos y condiciones antes de confirmar. Referencias: [precios](https://docs.lemonsqueezy.com/api/prices/the-price-object) y [checkout](https://docs.lemonsqueezy.com/api/checkouts/create-checkout).

Registrar el webhook en `/api/webhooks/lemon-squeezy` con los eventos `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_paused`, `subscription_unpaused`, `subscription_payment_success`, `subscription_payment_failed`, `subscription_payment_recovered` y `subscription_payment_refunded`.

El webhook verifica HMAC del cuerpo original, consulta la suscripción canónica, comprueba tienda, variante, modo y propietario, y aplica un snapshot en una transacción. El registro de eventos y los bloqueos por usuario evitan duplicados y retrocesos por entregas fuera de orden. Las facturas usan `subscription_id`, nunca su ID de factura. Los errores recuperables retornan 503 para permitir reintentos. Los checkouts en preparación tienen una reserva de 90 segundos y las URLs se reutilizan 25 minutos; una cuenta con suscripción vigente debe gestionar el pago existente. El portal obtiene una URL firmada nueva en cada solicitud autenticada.

## Instalación y verificación

En una base existente con las migraciones 001–026, ejecutar solamente:

```powershell
node --env-file=.env.local scripts/deploy-analytics-premium.mjs
```

Las migraciones 027 y 028 se aplican juntas en una transacción; no ejecutar `db:setup` sobre producción para esta actualización. El script de auditoría no imprime identidades ni credenciales.

Para pruebas aisladas instalar PGlite en la carpeta ignorada:

```powershell
npm install --prefix .analytics-test-runtime --no-save --package-lock=false @electric-sql/pglite
node scripts/test-analytics.mjs
node scripts/test-premium.mjs
node scripts/test-billing.mjs
npm run lint
npm run build
```

Las pruebas cubren trial nuevo y restante, expiración, permisos y conservación de contenido, activación, cancelación, gracia, renovación, eventos repetidos o antiguos, rollback, propiedad y reservas de checkout; Analytics se prueba con el mismo acceso. No crean usuarios ni pagos en producción. El cobro completo requiere una transacción en modo de prueba y entrega real del webhook con credenciales del proveedor. Sin esas credenciales, no se debe afirmar que el cobro fue validado.

`scripts/test-premium-ui.mjs` verifica pantallas de 375, 768 y 1440 píxeles, pricing, trial/Free/Premium/expirado, modal, paywall y estados vacíos/error/reintento. Requiere Playwright (instalado en `.analytics-test-runtime` o señalado por `PLAYWRIGHT_MODULE`) y `npm run dev -- --port 3107`. Crea y retira una ruta local de fixtures; no ejecutar sobre un servidor desplegado. Las capturas quedan en la carpeta ignorada de pruebas.
