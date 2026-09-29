# journey-front — Reglas del proyecto

## Active Plugins

These plugins are installed globally and must be used in every session:

- **superpowers** — structured development methodology (brainstorm → plan → execute)
- **caveman** — ultra-compressed responses to cut token usage
- **claude-mem** — persistent memory across sessions
- **context-mode** — context window optimization (sandboxes tool output)
- **ui-ux-pro-max** — design intelligence: 50+ styles, 161 palettes, 99 UX guidelines, accessibility checklist

## claude-mem (Persistent Memory)

claude-mem captures everything done during sessions, compresses it with AI, and injects relevant context into future sessions automatically.

- At session start: claude-mem injects context from previous sessions — read it and orient accordingly before starting any work.
- At session end or on compaction: save a summary of what was done, decisions made, and files modified.
- Use `/mem` commands if available to query or update memory manually.
- Never discard injected context — it represents real prior work.

## context-mode (Context Window Optimization)

context-mode sandboxes tool outputs to prevent context bloat (98% reduction on raw tool output).

- Always prefer `ctx_execute`, `ctx_batch_execute`, and `ctx_fetch_and_index` over raw Bash/Read/WebFetch when dealing with large outputs.
- Use `ctx_search` to query indexed content instead of re-reading files already indexed.
- Use `ctx_index` to index large files or directories before working on them.
- Let context-mode hooks intercept Bash, Read, WebFetch, and Grep calls automatically — do not bypass them.

## superpowers (Development Methodology)

For any non-trivial feature or task, follow this pipeline:

1. `/superpowers:brainstorm` — explore the problem space before touching code
2. `/superpowers:write-plan` — get explicit sign-off on the approach
3. `/superpowers:execute-plan` — implement in batches with checkpoints
4. `/superpowers:code-review` — review before merging

Never skip to implementation without a plan on complex tasks.

## ui-ux-pro-max (Design Intelligence)

Invoke this skill whenever the task touches UI structure, visual design, or UX quality.

- **Must use**: designing new pages, creating/refactoring UI components, choosing colors/typography/layout, reviewing UI for accessibility or consistency, implementing navigation or animations.
- **Recommended**: when UI looks unprofessional but reason is unclear, pre-launch quality review, building design systems.
- **Skip**: pure backend, API/DB design, DevOps, non-visual scripts.

Always run the Pre-Delivery Checklist before delivering UI code (icons, interaction, layout, accessibility).

## caveman (Token Compression)

- Default mode is active. Keep responses compressed: no filler, no pleasantries, no narration of obvious steps.
- Use `/caveman ultra` for maximum compression on long sessions.
- Code blocks are always emitted verbatim regardless of mode — compression applies only to prose.

## General Behavior

- Read injected claude-mem context at the start of every session before asking clarifying questions.
- Trust context-mode to manage tool output size — do not manually truncate or summarize tool results that context-mode is already handling.
- On long sessions, periodically check `budget.remaining()` context budget and use `/caveman ultra` if nearing limits.

---

## Reglas de Trabajo

0. **Responder siempre en español** — Todas las respuestas, comentarios, explicaciones y preguntas deben ser en español, sin excepcion. Solo el codigo y los nombres tecnicos permanecen en ingles.

1. **No programar sin contexto** — ANTES de escribir codigo: lee los archivos relevantes, revisa git log, entiende la arquitectura. Si no tienes contexto suficiente, pregunta. No asumas.

2. **Respuestas cortas** — Responde en 1-3 oraciones. Sin preambulos, sin resumen final. No repitas lo que el usuario dijo. No expliques lo obvio. Codigo habla por si mismo: no narres cada linea que escribes.

3. **No reescribir archivos completos** — Usa Edit (reemplazo parcial), NUNCA Write para archivos existentes salvo que el cambio sea >80% del archivo. Cambia solo lo necesario. No "limpies" codigo alrededor del cambio.

4. **No releer archivos ya leidos** — Si ya leiste un archivo en esta conversacion, no lo vuelvas a leer salvo que haya cambiado. Toma notas mentales de lo importante en tu primera lectura.

5. **Validar antes de declarar hecho** — Despues de un cambio: compila, corre tests, o verifica que funciona. Nunca digas "listo" sin evidencia de que funciona.

6. **Cero charla aduladora** — No digas "Excelente pregunta", "Gran idea", "Perfecto", etc. No halagues al usuario. Ve directo al trabajo.

7. **Soluciones simples** — Implementa lo minimo que resuelve el problema. Nada mas. No agregues abstracciones, helpers, tipos, validaciones, ni features que no se pidieron. 3 lineas repetidas > 1 abstraccion prematura.

8. **No pelear con el usuario** — Si el usuario dice "hazlo asi", hazlo asi. No debatas salvo riesgo real de seguridad o perdida de datos. Si discrepas, menciona tu concern en 1 oracion y procede con lo que pidio.

9. **Leer solo lo necesario** — No leas archivos completos si solo necesitas una seccion. Usa offset y limit. Si sabes la ruta exacta, usa Read directo. No hagas Glob + Grep + Read cuando Read basta.

10. **No narrar el plan antes de ejecutar** — No digas "Voy a leer el archivo, luego modificar la funcion, luego compilar...". Solo hazlo. El usuario ve tus tool calls. No necesita un preview en texto.

11. **Paralelizar tool calls** — Si necesitas leer 3 archivos independientes, lee los 3 en un solo mensaje, no uno por uno. Menos roundtrips = menos tokens de contexto acumulado.

12. **No duplicar codigo en la respuesta** — Si ya editaste un archivo, no copies el resultado en tu respuesta. El usuario lo ve en el diff. Si creaste un archivo, no lo muestres entero en texto tambien.

13. **No usar Agent cuando Grep/Read basta** — Agent duplica todo el contexto en un subproceso. Solo usalo para busquedas amplias o tareas complejas. Para buscar una funcion o archivo especifico, usa Grep o Glob directo.


## Servicios (llamadas a la API)

- Un archivo por llamada en `src/services/<dominio>/<accion>.js`: `axios` + `awsAuth.getToken()` en el header `Authorization: Bearer` + `try/catch` que relanza `new Error(mensaje, { cause: error })`. No mezclar varias llamadas en un mismo archivo de servicio.

## Modales

- Reusar el patrón existente: `.modal-overlay` (click fuera cierra) > `.modal-box` > `.modal-header` (título + `.modal-close`) + `.modal-form` (contenido) + `.modal-actions` (botones). Ver `ModulosUsuarios.jsx` (`EditModal`, `EnrollmentsModal`) o `AdminLogs.jsx` (`LogDetailModal`) como referencia. No inventar markup de modal nuevo.

## CSS

- No hay scoping por componente: Vite bundlea todas las hojas de estilo globalmente, así que un `.className` definido en un archivo aplica en cualquier página que lo use, aunque no importe ese archivo directamente. Antes de nombrar una clase nueva, `grep` el nombre en `src/styles/` para no pisar una ya usada en otra página con otro significado (ej: no reusar `.expand-grid` de `SyncMatriculas.css` para algo con otra cantidad de columnas — mejor un nombre propio tipo `.log-detail-grid`).
- Tablas responsivas: toda `<td>` de datos de una `.data-table`/`.reportes-tabla` lleva `data-label` con el nombre de su columna (en columnas generadas con `COLUMNS.map`, `data-label={col.label}`). En ≤768px `styles/global/Tables.css` convierte cada fila en tarjeta y muestra esa etiqueta; las celdas con `colSpan` (vacío, fila expandida) van sin `data-label`. Una tabla nueva sin `data-label` se ve con valores sin nombre en celular.
- Clases genéricas ya establecidas para reusar: `.data-table`, `.badge` (+ `badge-pending`, `badge-error`, `badge-synced`, etc.), `.btn-primary`/`.btn-secondary`/`.btn-icon`, `.filters-bar`, `.loading-box`.

## Permisos y navegación

- `submoduleCode` es la clave que une tres cosas: la ruta protegida en `App.jsx` (`<PrivateRoute submoduleCode="...">`), la jerarquía del sidebar en `components/sidenav/SideNavItems.jsx`, y `logs.entity_type` (usado por `AdminLogs.jsx` para resolver Aplicación/Módulo). Si se agrega un submódulo nuevo, tiene que quedar consistente en los tres lugares (y en el backend, en `saveLog`/`checkPermission`).
- **Recargar (F5) nunca debe dejar al usuario sin permisos ni sacarlo al login.** Reglas obligatorias en `services/PermissionsContext.jsx` y `components/PrivateRoute.jsx`:
  - No tocar `loadingPermissions` mientras `auth.isLoading` sea true (oidc todavía está restaurando la sesión). Poner `loadingPermissions=false` antes de tiempo hace que `PrivateRoute` redirija con `permissions=null`.
  - Un fallo de red/API al pedir `/auth/permissions` NO es "sin permisos": se reintenta y, si sigue fallando, se marca `permissionsError` y `PrivateRoute` muestra "Reintentar". Nunca redirigir a `/no-autorizado` por un error de carga; solo cuando la API respondió y el rol realmente no tiene el submódulo.
  - Si al cargar la sesión guardada está vencida (`auth.user?.expired`), intentar `signinSilent()` (refresh token) antes de mandar a `/login`.
  - `GetServiceAuth` lleva `timeout`: sin él, una API colgada deja la app en el loader para siempre.
  - Cualquier cambio en autenticación/permisos se verifica en el navegador: F5 en rutas anidadas (`/admin/logs`, `/sync/novedades`, `/modulos/matriculas`) y F5 con `expires_at` forzado al pasado en `localStorage`; la URL debe mantenerse.
- Usuarios y matrículas llegan a Moodle solo por BD externa: el botón "Sincronizar" del front solo marca el registro en Nexo y el cron de Moodle lo toma. No agregar servicios que llamen endpoints de la API que crean/matriculan directo en Moodle (regla completa en `journey-api/CLAUDE.md`).
- Cache tipo SWR en `services/swrCache.js` (`getCached`/`setCached`): páginas relacionadas (ej. Sync Usuarios y Módulo Usuarios) comparten la misma `CACHE_KEY` porque consultan el mismo preview — no crear una key nueva si ya existe una para los mismos datos.

## Entorno local

- El login OIDC tiene el `redirect_uri` fijo a `http://localhost:5173` en `src/config.js`. Si el dev server levanta en otro puerto (5174, 5175 por procesos zombie), el login falla.
