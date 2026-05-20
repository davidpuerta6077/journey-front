import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react'
import { fetchEnrollments } from '../../services/matriculas/fetchEnrollments'
import { syncEnrollments } from '../../services/matriculas/syncEnrollments'
import '../../styles/main/SyncMatriculas.css'

const COLUMNS = [
  { key: 'codigo_journey', label: 'Código Journey' },
  { key: 'nombre_asignatura', label: 'Asignatura' },
  { key: 'nombre', label: 'Estudiante' },
  { key: 'email', label: 'Email' },
  { key: 'periodo', label: 'Período' },
  { key: 'grupo', label: 'Grupo' },
  { key: 'estado', label: 'Estado' },
]

function StatusBadge({ row }) {
  if (row._status === 'error') return <span className="badge badge-error">Error</span>
  if (row._status === 'success') return <span className="badge badge-success">Sincronizado</span>
  if (row.moodle_enrollment_id) return <span className="badge badge-synced">Sincronizado</span>
  return <span className="badge badge-pending">Pendiente</span>
}

export default function SyncMatriculas() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterPrograma, setFilterPrograma] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterSync, setFilterSync] = useState('')
  const [sortKey, setSortKey] = useState('codigo_journey')
  const [sortDir, setSortDir] = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [selected, setSelected] = useState({})
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEnrollments()
      setEnrollments(data)
    } catch (err) {
      console.error('Error cargando matrículas:', err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  const filtered = useMemo(() => {
    let data = [...enrollments]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e =>
        Object.values(e).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
      )
    }
    if (filterPeriodo) data = data.filter(e => e.periodo === filterPeriodo)
    if (filterPrograma) data = data.filter(e => e.programa === filterPrograma)
    if (filterEstado) data = data.filter(e => e.estado === filterEstado)
    if (filterSync === 'sincronizado') data = data.filter(e => e.moodle_enrollment_id)
    if (filterSync === 'pendiente') data = data.filter(e => !e.moodle_enrollment_id)
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [enrollments, search, filterPeriodo, filterPrograma, filterEstado, filterSync, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const periodos = [...new Set(enrollments.map(e => e.periodo).filter(Boolean))]
  const programas = [...new Set(enrollments.map(e => e.programa).filter(Boolean))]
  const estados = [...new Set(enrollments.map(e => e.estado).filter(Boolean))]

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
    try {
      await syncEnrollments(selectedItems)
      setSelected({})
      await loadEnrollments()
    } catch (err) {
      console.error('Error sincronizando:', err.message)
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
        <select className="filter-select" value={filterSync} onChange={e => { setFilterSync(e.target.value); setPage(1) }}>
          <option value="">Todos</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box">Cargando matrículas...</div>
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
                  <>
                    <tr key={enr.id} className={selected[enr.id] ? 'row-selected' : ''}>
                      <td><input type="checkbox" checked={!!selected[enr.id]} onChange={() => toggleSelect(enr.id)} /></td>
                      {COLUMNS.map(col => (
                        <td key={col.key}>
                          {col.key === 'codigo_journey'
                            ? <span className="codigo-journey">{enr[col.key] || '-'}</span>
                            : enr[col.key] || '-'}
                        </td>
                      ))}
                      <td><StatusBadge row={enr} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(enr.id)} title="Ver más">
                            {expandedRows[enr.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[enr.id] && (
                      <tr key={`expand-${enr.id}`} className="expand-row">
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
                                <span className="expand-value">{enr.role || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Course ID</span>
                                <span className="expand-value">{enr.courseid || 'Sin asignar'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Moodle Enrollment ID</span>
                                <span className="expand-value">{enr.moodle_enrollment_id || 'Sin sincronizar'}</span>
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
                  </>
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
                  <>
                    {i > 0 && arr[i - 1] !== p - 1 && <span key={`dot-${p}`} className="page-dots">...</span>}
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  </>
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