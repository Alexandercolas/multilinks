# Administración

Solo las cuentas del propietario @alexander-x y @colasalexander69 tienen acceso. La tabla platform_owner fija sus IDs; cambiar un nombre de perfil no cambia los permisos. Otros registros en admins no otorgan acceso al panel. No hay controles para conceder el rol desde el navegador.

El directorio permite buscar usuarios, consultar acceso efectivo y abrir su perfil. Las acciones disponibles son activar Premium por 30/90/365 días o sin vencimiento, forzar Free, restaurar el plan automático, ocultar/publicar un perfil y suspender/reactivar una cuenta. Las cuentas propietarias están protegidas frente a estas acciones, incluso entre sí.

Cada cambio requiere motivo y confirmación con el usuario de destino. El servidor exige sesión, rol del propietario, mismo origen y límite de solicitudes; las funciones SQL vuelven a comprobar permisos. La auditoría conserva destino, actor, comando, duración y motivo. Las tablas de configuración y acceso manual no permiten escritura directa desde clientes.

El control de Premium afecta acceso a funciones, no facturación: no cancela ni reembolsa pagos externos. El webhook mantiene la suscripción original mientras el control manual tiene prioridad. Restaurar automático recupera el acceso según suscripción/prueba. Una concesión temporal vencida deja de aplicar automáticamente. Nunca se borran enlaces ni datos de la cuenta al forzar Free.

Migración 032 aplicada a Supabase el 10 de octubre de 2026. Pruebas SQL: node scripts/test-admin-controls.mjs (PGlite aislado). Pruebas de cuenta: scripts/test-account-flow.mjs valida que cuentas ordinarias y peticiones sin sesión no accedan al API. La revisión visual local usa datos simulados y no modifica usuarios reales.

## Organización del panel

- Usuarios: tabla horizontal, búsqueda en el servidor por nombre, correo o usuario y 5 cuentas por página. Activar/desactivar Pro abre un único formulario para la cuenta seleccionada.
- Reportes y soporte: tablas con 5 casos por página, filtros de estado y búsqueda en el servidor; el detalle y las decisiones se abren mediante «Ver caso». Los filtros permiten consultar casos cerrados y resueltos.
- Actividad: tabla de los últimos 100 movimientos, búsqueda y 5 registros por página.
- En móvil, cada tabla se desplaza horizontalmente dentro de su sección.
