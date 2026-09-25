# journey-front — Reglas del proyecto

## Servicios (llamadas a la API)

- Un archivo por llamada en `src/services/<dominio>/<accion>.js`: `axios` + `awsAuth.getToken()` en el header `Authorization: Bearer` + `try/catch` que relanza `new Error(mensaje, { cause: error })`. No mezclar varias llamadas en un mismo archivo de servicio.

## Modales

- Reusar el patrón existente: `.modal-overlay` (click fuera cierra) > `.modal-box` > `.modal-header` (título + `.modal-close`) + `.modal-form` (contenido) + `.modal-actions` (botones). Ver `ModulosUsuarios.jsx` (`EditModal`, `EnrollmentsModal`) o `AdminLogs.jsx` (`LogDetailModal`) como referencia. No inventar markup de modal nuevo.

## CSS

- No hay scoping por componente: Vite bundlea todas las hojas de estilo globalmente, así que un `.className` definido en un archivo aplica en cualquier página que lo use, aunque no importe ese archivo directamente. Antes de nombrar una clase nueva, `grep` el nombre en `src/styles/` para no pisar una ya usada en otra página con otro significado (ej: no reusar `.expand-grid` de `SyncMatriculas.css` para algo con otra cantidad de columnas — mejor un nombre propio tipo `.log-detail-grid`).
- Clases genéricas ya establecidas para reusar: `.data-table`, `.badge` (+ `badge-pending`, `badge-error`, `badge-synced`, etc.), `.btn-primary`/`.btn-secondary`/`.btn-icon`, `.filters-bar`, `.loading-box`.

## Permisos y navegación

- `submoduleCode` es la clave que une tres cosas: la ruta protegida en `App.jsx` (`<PrivateRoute submoduleCode="...">`), la jerarquía del sidebar en `components/sidenav/SideNavItems.jsx`, y `logs.entity_type` (usado por `AdminLogs.jsx` para resolver Aplicación/Módulo). Si se agrega un submódulo nuevo, tiene que quedar consistente en los tres lugares (y en el backend, en `saveLog`/`checkPermission`).
- Cache tipo SWR en `services/swrCache.js` (`getCached`/`setCached`): páginas relacionadas (ej. Sync Usuarios y Módulo Usuarios) comparten la misma `CACHE_KEY` porque consultan el mismo preview — no crear una key nueva si ya existe una para los mismos datos.

## Entorno local

- El login OIDC tiene el `redirect_uri` fijo a `http://localhost:5173` en `src/config.js`. Si el dev server levanta en otro puerto (5174, 5175 por procesos zombie), el login falla.
