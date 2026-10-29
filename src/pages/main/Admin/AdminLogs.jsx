import { useState, useEffect, useCallback, useMemo } from 'react'
import { Eye } from 'lucide-react'
import ColumnFilter from '../../../components/ColumnFilter'
import { fetchLogs } from '../../../services/admin/fetchLogs'
import { humanize } from '../Sync/novedadNombres'
import { menuItems } from '../../../components/sidenav/SideNavItems'
import Paginacion from '../../../components/Paginacion'
import "../../../styles/main/Sync/SyncUsuariosP.css"

// El menú lateral es la fuente de verdad de la jerarquía: cada submódulo
// (submoduleCode, lo mismo que se guarda en logs.entity_type) cuelga de una
// categoría principal (aplicación) y, opcionalmente, de un módulo intermedio.
// Se recorre menuItems una sola vez para armar { submoduleCode -> {aplicacion, modulo} }.
function buildSubmoduleIndex() {
  const index = {}
  for (const top of menuItems) {
    if (top.type === 'divider' || !top.label) continue
    if (top.submoduleCode) index[top.submoduleCode] = { aplicacion: top.label, modulo: top.label }
    for (const mid of top.children || []) {
      if (mid.submoduleCode) index[mid.submoduleCode] = { aplicacion: top.label, modulo: mid.label }
      for (const leaf of mid.children || []) {
        if (leaf.submoduleCode) index[leaf.submoduleCode] = { aplicacion: top.label, modulo: mid.label }
      }
    }
  }
  return index
}

// Categoría principal por defecto: todo lo que no se pueda clasificar pertenece
// a la app base del sistema.
const APP_POR_DEFECTO = 'Nexo'

// Derivar del prefijo de ruta que queda en la descripción
// (ej. "POST /courses/sync" -> Nexo / Cursos).
const ROUTE_APP = {
  users:        { aplicacion: 'Nexo', modulo: 'Usuarios' },
  courses:      { aplicacion: 'Nexo', modulo: 'Cursos' },
  enrollments:  { aplicacion: 'Nexo', modulo: 'Matrículas' },
  grades:       { aplicacion: 'Nexo', modulo: 'Calificaciones' },
  sicau:        { aplicacion: 'Nexo', modulo: 'SICAU' },
  auth:         { aplicacion: 'Nexo', modulo: 'Sesión / Perfil' },
  admin:        { aplicacion: 'Administrador', modulo: 'Administrador' },
  virtual_labs: { aplicacion: 'Laboratorios Virtuales', modulo: 'Laboratorios Virtuales' },
  // Atom vive dentro del Index como widget (sin ruta ni entrada en el sidebar
  // propias, ver components/atom/), así que no cuelga de submoduleIndex: se
  // resuelve por el prefijo de ruta /atom/... de la descripción del log.
  atom: { aplicacion: 'Nexo', modulo: 'Atom' },
}

// Nombres legacy de entity_type / type que ya existían en la tabla.
const LEGACY = {
  course: 'Cursos', user: 'Usuarios', enrollment: 'Matrículas',
}

function resolveByRoute(description) {
  const seg = String(description || '').match(/\/([a-z_]+)/i)
  return seg ? ROUTE_APP[seg[1].toLowerCase()] : null
}

function resolveByType(type) {
  const t = String(type || '').toLowerCase()
  if (t.startsWith('sync_error') || t.startsWith('sync')) return { aplicacion: 'Nexo', modulo: 'Sincronización' }
  if (t.includes('matr')) return { aplicacion: 'Nexo', modulo: 'Matrículas' }
  return null
}

function resolveLog(log, submoduleIndex) {
  const byMenu = submoduleIndex[log.entity_type]
  const byRoute = resolveByRoute(log.description)
  const byType = resolveByType(log.type)
  return {
    aplicacion: byMenu?.aplicacion || log.aplicacion || byRoute?.aplicacion || byType?.aplicacion || APP_POR_DEFECTO,
    modulo: byMenu?.modulo || log.modulo || byRoute?.modulo || byType?.modulo || LEGACY[log.entity_type] || log.entity_type || '—',
  }
}

// Columnas de la vista. `key` es el campo del row ya formateado para mostrar,
// y también la clave de su filtro por columna.
const COLUMNS = [
  { key: 'username',    label: 'Usuario' },
  { key: 'aplicacion',  label: 'Aplicación' },
  { key: 'modulo',      label: 'Módulo' },
  { key: 'description', label: 'Descripción' },
  { key: 'fecha',       label: 'Fecha-hora' },
]

// Nombres legibles para las claves que arman los `detalle` de saveLog en el
// backend (api/**/network.js). Lo que no está acá se humaniza (quita guiones
// bajos, mayúscula inicial) en vez de mostrar la clave cruda.
const FIELD_LABELS = {
  id: 'ID', userid: 'ID usuario', courseid: 'ID curso', role_id: 'ID rol', submodule_id: 'ID submódulo',
  username: 'Usuario', nombre: 'Nombre', estudiante: 'Estudiante', email: 'Correo', documento: 'Documento',
  cedula: 'Cédula', curso: 'Curso', codigo_asignatura: 'Código asignatura', nombre_asignatura: 'Asignatura',
  codigo_journey: 'Código Nexo', grupo: 'Grupo', periodo: 'Período', role: 'Rol', rol: 'Rol',
  estado: 'Estado', estado_anterior: 'Estado anterior', estado_nuevo: 'Estado nuevo', status: 'Resultado',
  fullname: 'Nombre completo', shortname: 'Nombre corto', idnumber: 'Código', categoryid: 'ID categoría',
  name: 'Nombre', code: 'Código', module_id: 'ID módulo', archivo: 'Archivo', seed_shortname: 'Semilla',
  departamento: 'Departamento', programa: 'Programa', docente: 'Docente', suspend: 'Suspendido',
  estado_curso: 'Estado del curso', cedulas_matriculadas: 'Cédulas matriculadas',
  modulo: 'Módulo', submodulo: 'Submódulo', activo: 'Activo',
}

function fieldLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
}

// El detalle (columna logs.detail) es un array de objetos con los campos
// puntuales de cada item afectado (ej. correo/curso de cada matrícula
// enviada por SICAU). Va en un modal aparte (no inline en la fila): esta
// info es más sensible que el resto de la tabla (documentos, correos, etc.)
// y el patrón del resto del sistema (ver ModulosUsuarios > "Ver matrículas",
// SyncNovedades > fila expandida) es un grid de campo/valor etiquetado, no
// un volcado crudo de "clave: valor" pegado con puntos.
// Formatea un array {campo, anterior, actual} (mismo shape que sicau_novedades.cambios
// y users.novedad_datos) igual que NovedadesSicau.jsx/NovedadesUsuarios.jsx, para que
// un detalle de log con una novedad adentro (ver api/SICAU/network.js:logIngestaSicau)
// se lea igual de legible que en Sync > Novedades, en vez de "[object Object]".
function esListaDeCambios(v) {
  return Array.isArray(v) && v.length > 0 && v.every(c => c && typeof c === 'object' && 'campo' in c)
}
function formatCambios(cambios) {
  return cambios.map(c => `${fieldLabel(c.campo)}: ${c.anterior ?? '—'} → ${c.actual ?? '—'}`).join(' · ')
}

// Un valor del detalle puede ser un primitivo, un array de cambios, un objeto
// tipo novedad ({tipo, motivo, cambios}) o un array de objetos genérico (ej.
// "novedades": [{cedula, novedad}] de la ingesta por lote de SICAU). Cada caso
// se aplana a algo legible; el array-de-objetos genérico se anida como su
// propio sub-grid en vez de volcarse crudo.
function renderDetailValue(v) {
  if (esListaDeCambios(v)) {
    return <span className="log-detail-value">{formatCambios(v)}</span>
  }
  if (Array.isArray(v)) {
    if (v.every(x => x === null || typeof x !== 'object')) {
      return <span className="log-detail-value">{v.join(', ')}</span>
    }
    return (
      <div className="log-detail-sublist">
        {v.map((obj, i) => <DetailItem key={i} item={obj} />)}
      </div>
    )
  }
  if (v && typeof v === 'object') {
    if (Array.isArray(v.cambios)) {
      const resumen = v.tipo ? humanize(v.tipo) : null
      const cambios = formatCambios(v.cambios)
      return <span className="log-detail-value">{[resumen, v.motivo, cambios].filter(Boolean).join(' · ')}</span>
    }
    return <DetailItem item={v} />
  }
  return <span className="log-detail-value">{String(v)}</span>
}

function DetailItem({ item }) {
  const entries = Object.entries(item || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')
  return (
    <div className="log-detail-grid">
      {entries.map(([k, v]) => (
        <div className={`log-detail-field ${typeof v === 'object' ? 'log-detail-field-full' : ''}`} key={k}>
          <span className="log-detail-label">{fieldLabel(k)}</span>
          {renderDetailValue(v)}
        </div>
      ))}
    </div>
  )
}

function LogDetailModal({ row, onClose }) {
  // Logs viejos (o rutas que todavía no mandan `detalle` a saveLog) no tienen
  // logs.detail: se arma un detalle genérico con los campos que sí hay,
  // para que el botón de detalle sea consistente en todas las filas.
  const items = row.detail
    ? (Array.isArray(row.detail) ? row.detail : [row.detail])
    : [{ usuario: row.username, aplicacion: row.aplicacion, modulo: row.modulo, fecha: row.fecha }]
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '640px', width: '90vw' }}>
        <div className="modal-header">
          <h3>Detalle del registro</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {items.length > 1 && <p className="log-detail-count">{items.length} elementos</p>}
          {items.map((item, i) => (
            <div key={i} className={i > 0 ? 'log-detail-divider' : ''}>
              <DetailItem item={item} />
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// La API devuelve como máximo los últimos LIMITE_LOGS registros (LIMIT en
// selectLogsData). Si llegan exactamente esos, hay historial más antiguo que
// no se está mostrando y se avisa en la barra.
const LIMITE_LOGS = 300

export default function AdminLogs() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filters, setFilters] = useState({})   // { colKey: Set<string> }
  const [detailRow, setDetailRow] = useState(null)
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(10)

  const submoduleIndex = useMemo(() => buildSubmoduleIndex(), [])

  // Cada row queda con los mismos campos que se pintan (y sobre los que se filtra):
  // Prioridad de aplicación/módulo: menú lateral → JOIN de la API → ruta → tipo.
  const rows = useMemo(() => logs.map(l => {
    const r = resolveLog(l, submoduleIndex)
    return {
      id: l.id,
      username: l.username || '-',
      aplicacion: r.aplicacion,
      modulo: r.modulo,
      description: l.description || '-',
      fecha: l.date ? new Date(l.date).toLocaleString() : '-',
      detail: l.detail || null,
    }
  }), [logs, submoduleIndex])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setLogs(await fetchLogs())
    } catch (e) {
      console.error('Error cargando logs:', e.message)
      setError(e.message)
      setLogs([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Valores distintos por columna (para el menú de filtro tipo Excel).
  const colValues = useMemo(() => {
    const m = {}
    for (const c of COLUMNS) {
      m[c.key] = [...new Set(rows.map(row => String(row[c.key])))].sort((a, b) => a.localeCompare(b, 'es'))
    }
    return m
  }, [rows])

  // Una fila pasa si su valor está entre los seleccionados de cada columna filtrada.
  const filtered = useMemo(() => rows.filter(row =>
    COLUMNS.every(c => {
      const sel = filters[c.key]
      return !sel || sel.has(String(row[c.key]))
    })
  ), [rows, filters])

  const setColFilter = (key, set) => { setFilters(f => ({ ...f, [key]: set || undefined })); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageActual = Math.min(page, totalPages)
  const paginated  = filtered.slice((pageActual - 1) * perPage, pageActual * perPage)
  const anyFilter = Object.values(filters).some(Boolean)

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Logs</h2>
      </div>

      {error && <div className="sync-error">{error}</div>}

      <div className="filters-bar">
        {anyFilter && (
          <button className="btn-secondary" onClick={() => { setFilters({}); setPage(1) }}>Limpiar filtros</button>
        )}
        <span className="results-count">{filtered.length} de {rows.length} registro{rows.length !== 1 ? 's' : ''}</span>
        {rows.length >= LIMITE_LOGS && (
          <span className="results-note">Mostrando solo los {LIMITE_LOGS} más recientes</span>
        )}
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando logs...</div>
      ) : (
        <>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {COLUMNS.map(c => (
                  <th key={c.key}>
                    <ColumnFilter
                      label={c.label}
                      values={colValues[c.key] || []}
                      selected={filters[c.key] ?? null}
                      onChange={(set) => setColFilter(c.key, set)}
                    />
                  </th>
                ))}
                <th style={{ width: 60 }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => (
                <tr key={row.id}>
                  {COLUMNS.map(c => <td data-label={c.label} key={c.key}>{row[c.key]}</td>)}
                  <td data-label="Detalle">
                    <button className="btn-icon" onClick={() => setDetailRow(row)} title="Ver detalle">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginacion page={pageActual} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
        </>
      )}

      {detailRow && <LogDetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
