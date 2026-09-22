import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Filter } from 'lucide-react'
import { fetchLogs } from '../../../services/admin/fetchLogs'
import { menuItems } from '../../../components/sidenav/SideNavItems'
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

// Filtro de columna estilo Excel: lista los valores presentes en esa columna
// con checkboxes. `selected === null` = todos visibles; si no, solo los del Set.
function ColumnFilter({ label, values, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const btnRef = useRef(null)

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 262)) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onScroll = (e) => { if (!ref.current || !ref.current.contains(e.target)) setOpen(false) }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const active = selected !== null && selected.size !== values.length
  const shown = values.filter(v => v.toLowerCase().includes(q.toLowerCase()))
  const isChecked = (v) => selected === null || selected.has(v)
  const allShownChecked = shown.length > 0 && shown.every(isChecked)

  const emit = (set) => onChange(set.size === values.length ? null : set)
  const toggle = (v) => {
    const base = selected === null ? new Set(values) : new Set(selected)
    base.has(v) ? base.delete(v) : base.add(v)
    emit(base)
  }
  const toggleAllShown = () => {
    const base = selected === null ? new Set(values) : new Set(selected)
    allShownChecked ? shown.forEach(v => base.delete(v)) : shown.forEach(v => base.add(v))
    emit(base)
  }

  return (
    <div ref={ref} className="col-filter">
      <span>{label}</span>
      <button
        ref={btnRef}
        type="button"
        title="Filtrar columna"
        className={`col-filter-btn${active ? ' is-active' : ''}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <Filter size={13} fill={active ? '#5b84ff' : 'none'} />
      </button>
      {open && (
        <div className="col-filter-menu" style={{ top: pos.top, left: pos.left }}>
          <input
            className="filter-input col-filter-search"
            placeholder="Buscar valor..."
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
          <label className="col-filter-all">
            <input type="checkbox" checked={allShownChecked} onChange={toggleAllShown} />
            (Seleccionar todo)
          </label>
          <div className="col-filter-list">
            {shown.length === 0 && <div className="col-filter-empty">Sin coincidencias</div>}
            {shown.map(v => (
              <label key={v} className="col-filter-opt">
                <input type="checkbox" checked={isChecked(v)} onChange={() => toggle(v)} />
                <span>{v || '—'}</span>
              </label>
            ))}
          </div>
          <div className="col-filter-actions">
            <button type="button" className="btn-secondary" onClick={() => { onChange(null); setQ('') }}>Limpiar</button>
            <button type="button" className="btn-primary" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
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

  const setColFilter = (key, set) => setFilters(f => ({ ...f, [key]: set || undefined }))
  const anyFilter = Object.values(filters).some(Boolean)

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Logs</h2>
      </div>

      {error && <div className="sync-error">{error}</div>}

      <div className="filters-bar">
        {anyFilter && (
          <button className="btn-secondary" onClick={() => setFilters({})}>Limpiar filtros</button>
        )}
        <span className="results-count">{filtered.length} de {rows.length} registro{rows.length !== 1 ? 's' : ''}</span>
        {rows.length >= LIMITE_LOGS && (
          <span className="results-note">Mostrando solo los {LIMITE_LOGS} más recientes</span>
        )}
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando logs...</div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  {COLUMNS.map(c => <td key={c.key}>{row[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
