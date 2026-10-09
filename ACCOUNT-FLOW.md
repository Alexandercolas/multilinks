# Registro, primera publicación y contraseña

Los botones del perfil público abren `/sign-in?mode=signup`. El registro pide confirmar la contraseña y muestra un estado específico de confirmación de correo. Al volver por `/auth/callback`, los enlaces inválidos o expirados muestran una explicación; los destinos de retorno se limitan a Dashboard y recuperación de contraseña. El origen público se conserva detrás de un proxy y puede fijarse con `NEXT_PUBLIC_APP_URL`.

El Dashboard guía a una cuenta nueva para elegir nombre y usuario, añadir su primer enlace y publicar. Valida usuarios de 3–30 caracteres y evita nombres de rutas reservadas. El primer perfil permanece privado mientras se guardan sus enlaces: un fallo de escritura no publica una página incompleta. Tras publicar se muestran la URL guardada, «Ver página publicada» y «Copiar mi URL». La URL de compartir no cambia por editar un usuario sin guardar.

En Ajustes → Seguridad, el formulario pide contraseña actual, nueva y confirmación. `/api/account/password` valida origen, sesión, longitud (8–128), coincidencia y límite de cinco intentos por quince minutos. Reautentica al mismo usuario con su contraseña actual antes de actualizarla; no utiliza la API administrativa para cambiar contraseñas. Las claves no se guardan en el perfil ni se incluyen en logs o URLs. Si se entró con enlace o no se conoce la contraseña, se conserva la recuperación por correo. Referencias: [actualización autenticada](https://supabase.com/docs/reference/javascript/auth-updateuser) y [seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security).

## Verificación

Con la versión compilada ejecutándose en el puerto 3107 y Playwright disponible:

```powershell
$env:PLAYWRIGHT_MODULE = 'ruta/al/playwright/index.mjs'
$env:QA_BASE_URL = 'http://127.0.0.1:3107'
node --env-file=.env.local scripts/test-account-flow.mjs
```

La prueba requiere las variables Supabase existentes. Solo admite un servidor de aplicación local. Simula la respuesta de confirmación de registro, sin enviar correo, y crea una cuenta QA aislada con email ya confirmado para probar acceso, borrador privado ante fallo, publicación real, copia de URL, contraseña incorrecta, cambio real de contraseña, acceso con la nueva clave y continuidad de sesión. Elimina la cuenta creada al finalizar. Usa la clave de servicio únicamente para crear, comprobar y limpiar esa cuenta temporal; no utiliza cuentas de personas existentes. No verifica entrega SMTP ni confirmación real de email: deben comprobarse en el dominio de producción con sus URLs de callback autorizadas en Supabase.
