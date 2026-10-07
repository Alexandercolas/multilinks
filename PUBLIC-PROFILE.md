# Rediseño del perfil público

La ruta `app/[username]/page.tsx` conserva consultas, publicación, permisos, metadata, canonical y Open Graph. `PublicProfileShell` organiza el contenido y las herramientas de compartir; `/demo` utiliza el mismo diseño. No cambia el modelo de datos ni requiere migraciones.

## Presentación

- Móvil y tableta: una columna, controles compactos y QR oculto hasta abrir el modal.
- Desde 1024 px: composición de 1020 px como máximo, perfil de hasta 756 px y columna secundaria de 216 px para compartir. El contenido interno se limita a 576 px para mantener la lectura.
- `ProfileCard`: avatar limpio, nombre principal, username discreto, biografía legible, destacados primero y títulos/descripciones que pueden ocupar varias líneas. Se respetan los estilos de botón del propietario.
- Colores y fuentes de los tokens existentes; bordes finos, foco visible y estados suaves, sin sombras grandes ni animaciones escalonadas.
- Fondos visibles: overlay general de 0–10 % y contraste localizado en identidad, contenido y footer cuando hay imagen o textura. Se mantienen los cuatro temas y presets.
- Branding pequeño al final, enlace a inicio y entrada a registro. Se respeta el derecho Premium a ocultar la marca; el propietario conserva “Editar mi perfil”.

## QR y compartir

`publicProfileUrl()` utiliza `NEXT_PUBLIC_APP_URL` si está configurado; en su ausencia, el origen de la solicitud actual. Codifica el username y no añade queries ni fragmentos. La misma URL se utiliza en QR, copiar, compartir y JSON-LD.

`generateProfileQr()` produce SVG en el servidor, sin servicios externos ni librería QR en el navegador. Incluye cuatro módulos de margen, negro sobre blanco y corrección M. Se muestra a 112 px en escritorio y 224 px en el modal móvil. El modal permite Escape, botón de cierre y clic exterior; utiliza el foco y confinamiento de teclado del diálogo nativo.

`ProfileShareTools` invoca Web Share cuando está disponible, vuelve a copiar ante falta de soporte o error recuperable y deja cancelar sin falso aviso de éxito. Copiar utiliza Clipboard API, fallback de selección y copia, o un campo seleccionable si el navegador deniega ambas vías. Los avisos usan una región de estado accesible. Referencias: [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) y [Clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).

## Multimedia y estadísticas

YouTube conserva proporción 16:9 y thumbnails con ajuste cover, sin deformación. Spotify y otros proveedores de audio muestran una entrada compacta; al pulsarla se carga el iframe oficial existente. YouTube Music continúa como enlace real. Todos comparten superficies, tipografía e iconos.

Los iframes no se cargan antes de la interacción. Las imágenes multimedia son diferidas y tienen dimensiones; el avatar mantiene su carga inicial. Se conservan `/api/click`, `/api/play`, `/api/view` y `/api/impressions`. El observador mide la tarjeta completa con `data-analytics-link`, en vez de solo un ancla dentro de una tarjeta multimedia. Los permisos Free/Premium siguen resolviéndose en backend.

## Verificación reproducible

```powershell
npm install --prefix .profile-test-runtime --no-save --package-lock=false playwright jsqr axe-core
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.profile-test-runtime/browsers'
node .profile-test-runtime/node_modules/playwright/cli.js install firefox webkit
npm run dev -- --port 3107
```

En otra terminal, con la misma variable de navegadores, ejecutar `node scripts/test-public-profile-ui.mjs`. Chrome y Edge deben estar instalados; `QA_ENGINES` selecciona motores. `PLAYWRIGHT_MODULE` permite reutilizar Playwright existente. La fixture temporal está deshabilitada en producción y se elimina al finalizar; no crea perfiles ni eventos en Supabase.

La suite verifica diez tamaños, incluidos 360×800, 390×844, 430×932, 1366×768, 1440×900 y 1920×1080. Decodifica el QR renderizado, comprueba copiar/compartir/cancelación/fallback, modal y Escape, carga diferida, destinos oficiales, llamadas de analytics y falta de scroll horizontal. Axe comprueba reglas WCAG A/AA en temas, fondos, nombres largos, Free, Premium y propietario. Las capturas quedan en `.profile-test-runtime/screenshots`.

Las respuestas externas de reproductores se controlan: se comprueba la integración y los destinos oficiales, sin garantizar reproducción de contenido restringido por el proveedor. WebKit cubre el motor de Safari; no sustituye una prueba física en iPhone/iPad. Las respuestas de compartir se simulan sin abrir aplicaciones ajenas.

Tras `npm run build`, iniciar `npm run start -- --port 3107` y ejecutar `node scripts/test-public-profile-production.mjs`. Esta comprobación usa la ruta real `/demo`: respuesta 200, canonical, CSP de producción, layout móvil/escritorio, copiar, modal QR y ausencia de errores de ejecución. Las pruebas de esta implementación pasaron en Chrome, Edge, Firefox y WebKit; build y lint finalizaron sin errores (tres advertencias anteriores).

Desarrollo permite depuración de React y omite la actualización HTTP→HTTPS de localhost necesaria para WebKit. Producción conserva CSP sin `unsafe-eval` y con `upgrade-insecure-requests`. ESLint ignora dependencias y navegadores de prueba locales.
