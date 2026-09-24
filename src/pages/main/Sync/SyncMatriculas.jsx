import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Search, UserX } from 'lucide-react'
import { fetchEnrollments } from '../../../services/matriculas/fetchEnrollments'
import { syncEnrollments } from '../../../services/matriculas/syncEnrollments'
import { getCached, setCached } from '../../../services/swrCache'
import "../../../styles/main/Sync/SyncMatriculas.css"
import { useNavigate } from 'react-router-dom'

// Misma key que Sync Novedades: las dos consultan exactamente el mismo
// preview de matrículas, así que lo que cargó una sirve de vista inicial
// instantánea en la otra.
const CACHE_KEY = 'enrollments-preview'

const ROLE_LABEL = {
  student:        'Estudiante',
  editingteacher: 'Profesor',
  teacher:        'Tutor'
}

const COLUMNS = [
  { key: 'codigo_journey',    label: 'Código Nexo' },
  { key: 'nombre_asignatura', label: 'Asignatura' },
  { key: 'nombre',            label: 'Estudiante' },
  { key: 'email',             label: 'Email' },
  { key: 'periodo',           label: 'Período' },
  { key: 'grupo',             label: 'Grupo' },
  { key: 'role',              label: 'Rol' },
  { key: 'estado',            label: 'Estado' },
]

function StatusBadge({ row }) {
  if (row._syncing) return <span className="badge badge-syncing">Sincronizando...</span>
  if (row._status === 'error' || row.estado_sync === 'error')
    return <span className="badge badge-error" title={row.ultimo_error_sync || ''}>Error</span>
  if (!row.userExistsInMoodle)     return <span className="badge badge-no-user">Usuario no existe en Moodle</span>
  if (row.estado_sync === 'desmatriculando')
    return <span className="badge badge-syncing" title="Moodle puede tardar 1-2 min en aplicar la baja; vuelve a sincronizar en un momento">Desmatriculando...</span>
  if (row.estado_sync === 'traslado')
    return <span className="badge badge-novedad" title="El estudiante cambió de grupo/curso en SICAU; revisa esta matrícula">Duplicado</span>
  if (row._syncStatus?.inMoodle)   return <span className="badge badge-synced">Sincronizado</span>
  if (row.sincronizado)            return <span className="badge badge-db">Solo en BD</span>
  return <span className="badge badge-pending">Pendiente</span>
}

export default function SyncMatriculas() {
  const navigate = useNavigate()

  const [enrollments, setEnrollments]       = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]               = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]               = useState(false)
  const [search, setSearch]                 = useState('')
  const [filterPeriodo, setFilterPeriodo]   = useState('')
  const [filterPrograma, setFilterPrograma] = useState('')
  const [filterEstado, setFilterEstado]     = useState('')
  const [filterSync, setFilterSync]         = useState('')
  const [filterRol, setFilterRol]           = useState('')
  const [sortKey, setSortKey]               = useState('codigo_journey')
  const [sortDir, setSortDir]               = useState('asc')
  const [expandedRows, setExpandedRows]     = useState({})
  const [selected, setSelected]             = useState({})
  const [page, setPage]                     = useState(1)
  const PER_PAGE = 15

  const loadEnrollments = useCallback(async () => {
    // Si ya hay algo en caché, se queda visible tal cual (sin spinner) mientras
    // esto trae el dato fresco por debajo; si no hay nada, sí se muestra el
    // loader normal.
    try {
      const data = await fetchEnrollments()
      setCached(CACHE_KEY, data)
      setEnrollments(data)
    } catch (err) {
      console.error('Error cargando matrículas:', err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  const periodos  = [...new Set(enrollments.map(e => e.periodo).filter(Boolean))]
  const programas = [...new Set(enrollments.map(e => e.programa).filter(Boolean))]
  const estados   = [...new Set(enrollments.map(e => e.estado).filter(Boolean))]

  const filtered = useMemo(() => {
    let data = [...enrollments]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e => Object.values(e).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterPeriodo)  data = data.filter(e => e.periodo === filterPeriodo)
    if (filterPrograma) data = data.filter(e => e.programa === filterPrograma)
    if (filterEstado)   data = data.filter(e => e.estado === filterEstado)
    if (filterRol)      data = data.filter(e => e.role === filterRol)
    if (filterSync === 'sincronizado')   data = data.filter(e => e._syncStatus?.inMoodle)
    if (filterSync === 'solo_bd')        data = data.filter(e => e.sincronizado && !e._syncStatus?.inMoodle)
    if (filterSync === 'pendiente')      data = data.filter(e => !e.sincronizado)
    if (filterSync === 'sin_usuario')    data = data.filter(e => !e.userExistsInMoodle)
    if (filterSync === 'traslado')       data = data.filter(e => e.estado_sync === 'traslado')
    if (filterSync === 'desmatriculando') data = data.filter(e => e.estado_sync === 'desmatriculando')
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [enrollments, search, filterPeriodo, filterPrograma, filterEstado, filterSync, filterRol, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const selectAll = () => {
    const allSelected = paginated.every(e => selected[e.id])
    const next = { ...selected }
    paginated.forEach(e => { next[e.id] = !allSelected })
    setSelected(next)
  }

  const selectedItems = enrollments.filter(e => selected[e.id])

  const handleSync = async () => {
    if (selectedItems.length === 0) return
    setSyncing(true)
    const syncingIds = new Set(selectedItems.map(e => e.id))
    setEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: true } : e))
    try {
      await syncEnrollments(selectedItems)
      setEnrollments(prev => prev.map(e =>
        syncingIds.has(e.id) ? { ...e, _syncing: false, sincronizado: true } : e
      ))
      setSelected({})
    } catch (err) {
      console.error('Error sincronizando:', err.message)
      setEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: false } : e))
    }
    setSyncing(false)
  }

  const allPageSelected = paginated.length > 0 && paginated.every(e => selected[e.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Matrículas Plataforma</h2>
        <button className="btn-primary" onClick={handleSync} disabled={selectedItems.length === 0 || syncing}>
          <RefreshCw size={15} />
          {syncing ? 'Sincronizando...' : `Sincronizar (${selectedItems.length})`}
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por código, asignatura, estudiante..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterPeriodo} onChange={e => { setFilterPeriodo(e.target.value); setPage(1) }}>
          <option value="">Todos los períodos</option>
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterPrograma} onChange={e => { setFilterPrograma(e.target.value); setPage(1) }}>
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          {estados.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="filter-select" value={filterRol} onChange={e => { setFilterRol(e.target.value); setPage(1) }}>
          <option value="">Todos los roles</option>
          <option value="student">Estudiante</option>
          <option value="editingteacher">Profesor</option>
          <option value="teacher">Tutor</option>
        </select>
        <select className="filter-select" value={filterSync} onChange={e => { setFilterSync(e.target.value); setPage(1) }}>
          <option value="">Todos</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="solo_bd">Solo en BD</option>
          <option value="pendiente">Pendiente</option>
          <option value="sin_usuario">Sin usuario en Moodle</option>
          <option value="traslado">Duplicado (cambió de curso)</option>
          <option value="desmatriculando">Desmatriculando...</option>
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando matrículas...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={allPageSelected} onChange={selectAll} /></th>
                  {COLUMNS.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                    </th>
                  ))}
                  <th>Sync</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(enr => (
                  <Fragment key={enr.id}>
                    <tr className={selected[enr.id] ? 'row-selected' : ''}>
                      <td><input type="checkbox" checked={!!selected[enr.id]} onChange={() => toggleSelect(enr.id)} /></td>
                      {COLUMNS.map(col => (
                        <td key={col.key}>
                          {col.key === 'codigo_journey'
                            ? <span className="codigo-journey">{enr[col.key] || '-'}</span>
                            : col.key === 'role'
                            ? ROLE_LABEL[enr.role] || enr.role || '-'
                            : enr[col.key] || '-'}
                        </td>
                      ))}
                      <td><StatusBadge row={enr} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(enr.id)} title="Ver más">
                            {expandedRows[enr.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {!enr.userExistsInMoodle && (
                            <button
                              className="btn-icon btn-icon-warning"
                              title="Ir a sincronizar usuario"
                              onClick={() => navigate(`/sync/usuarios?documento=${enr.documento}`)}
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows[enr.id] && (
                      <tr className="expand-row">
                        <td colSpan={COLUMNS.length + 3}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Documento</span>
                                <span className="expand-value">{enr.documento || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Programa</span>
                                <span className="expand-value">{enr.programa || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Rol</span>
                                <span className="expand-value">{ROLE_LABEL[enr.role] || enr.role || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha Creación</span>
                                <span className="expand-value">{enr.fecha_creacion_journey ? String(enr.fecha_creacion_journey).split('T')[0] : '-'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="page-dots">...</span>}
                    <button className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  </Fragment>
                ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
              <span className="page-info">Página {page} de {totalPages} — {filtered.length} registros</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}