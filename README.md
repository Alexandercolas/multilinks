# MultiLinks

Plataforma de enlaces construida con Next.js, TypeScript, Tailwind CSS y Supabase.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Perfil demo: `http://localhost:3000/demo`.

El dashboard persiste perfiles y enlaces en Supabase. Incluye Free con un enlace publicado, Premium por US$3.00/mes y 30 días de prueba completa al registrarse, con facturación mediante Lemon Squeezy.

Consulta [PREMIUM.md](PREMIUM.md) para configurar pagos, migraciones y permisos, y [ANALYTICS.md](ANALYTICS.md) para estadísticas, privacidad y validación.

El diseño del perfil público, QR, compartir y pruebas responsive están documentados en [PUBLIC-PROFILE.md](PUBLIC-PROFILE.md).

El registro, la primera publicación y el cambio de contraseña desde Ajustes están documentados en [ACCOUNT-FLOW.md](ACCOUNT-FLOW.md).

La sección Perfil permite ajustar el zoom y el encuadre horizontal/vertical de la foto antes de publicar. El recorte se guarda como una imagen cuadrada de 512 px; el perfil público y la vista previa usan la misma imagen.
