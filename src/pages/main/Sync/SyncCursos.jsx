import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, RefreshCw, Search } from 'lucide-react'
import axios from 'axios'
import config from '../../../config'
import awsAuth from '../../../services/AwsAuthService'
import { fetchReglas } from '../../../services/admin/fetchReglas'
import { getCached, setCached } from '../../../services/swrCache'
import '../../../styles/main/Sync/SyncMatriculas.css'

const BASE = config.api_domain.url_base
const CACHE_KEY = 'courses-sync-preview'

const COLUMNS = [
  { key: 'fullname',     label: 'Nombre Completo' },
  { key: 'shortname',    label: 'Nombre Corto' },
  { key: 'idnumber',     label: 'Código' },
  { key: 'nombre_profesor', label: 'Profesor' },
  { key: 'periodo',      label: 'Periodo' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'programa',     label: 'Programa' },
]

function StatusBadge({ row }) {
  const estado = row.estado_sync || (row.sincronizado ? 'sincronizado' : 'pendiente')
  if (estado === 'sincronizando') return <span className="badge badge-syncing">Sincronizando...</span>
  if (estado === 'error')         return <span className="badge badge-error" title={row.ultimo_error_sync || ''}>Error</span>
  if (estado === 'sincronizado')  return <span className="badge badge-synced">Sincronizado</span>
  if (estado === 'novedad')       return <span className="badge badge-novedad" title="Ya existe en Moodle; actualízalo desde Módulo Cursos">Novedad</span>
  return <span className="badge badge-pending">Pendiente</span>
}

export default function SyncCursos() {
  const [courses, setCourses]         = useState(() => getCached(CACHE_KEY) || [])
  const [reglas, setReglas]           = useState([])
  const [bulkRuleId, setBulkRuleId]   = useState('')
  const [loading, setLoading]         = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]         = useState(false)
  const [search, setSearch]           = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterDepto, setFilterDepto] = useState('')
  const [filterSync, setFilterSync]   = useState('')
  const [sortKey, setSortKey]         = useState('fullname')
  const [sortDir, setSortDir]         = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [selected, setSelected]       = useState({})
  const [page, setPage]               = useState(1)
  const PER_PAGE = 15

  const refreshCourses = useCallback(async () => {
    try {
      const token = awsAuth.getToken()
      const res = await axios.post(`${BASE}/courses/sync/preview`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data?.body || []
      setCached(CACHE_KEY, data)
      setCourses(data)
    } catch (e) {
      console.error('Error cargando cursos:', e.message)
    }
  }, [])

  const loadCourses = useCallback(async () => {
    await refreshCourses()
    setLoading(false)
  }, [refreshCourses])

  const loadReglas = useCallback(async () => {
    try {
      setReglas(await fetchReglas())
    } catch (e) {
      console.error('Error cargando reglas de sincronización:', e.message)
    }
  }, [])

  useEffect(() => { loadCourses(); loadReglas() }, [loadCourses, loadReglas])

  // Duplicar la semilla en Moodle es pesado (backup+restore); con 10-15 copias
  // en una corrida el backend ya no espera a que termine todo para responder,
  // así que mientras haya cursos en "sincronizando" se refresca la tabla cada
  // pocos segundos para ver cuándo Moodle va terminando cada uno.
  const hasSyncingRows = courses.some(c => c.estado_sync === 'sincronizando')
  useEffect(() => {
    if (!hasSyncingRows) return
    const interval = setInterval(refreshCourses, 4000)
    return () => clearInterval(interval)
  }, [hasSyncingRows, refreshCourses])

  const periodos = [...new Set(courses.map(c => c.periodo).filter(Boolean))]
  const deptos   = [...new Set(courses.map(c => c.departamento).filter(Boolean))]

  const filtered = useMemo(() => {
    let data = [...courses]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(c => Object.values(c).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterPeriodo) data = data.filter(c => c.periodo === filterPeriodo)
    if (filterDepto)   data = data.filter(c => c.departamento === filterDepto)
    if (filterSync) data = data.filter(c => (c.estado_sync || (c.sincronizado ? 'sincronizado' : 'pendiente')) === filterSync)
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [courses, search, filterPeriodo, filterDepto, filterSync, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const selectAll = () => {
    const allSelected = paginated.every(c => selected[c.id])
    const next = { ...selected }
    paginated.forEach(c => { next[c.id] = !allSelected })
    setSelected(next)
  }

  const selectedCourses = courses.filter(c => selected[c.id])

  const handleSync = async () => {
    if (selectedCourses.length === 0) return
    setSyncing(true)
    try {
      const token = awsAuth.getToken()
      const items = selectedCourses.map(c => ({
        ...c,
        rule_id: bulkRuleId ? Number(bulkRuleId) : null
      }))
      // El backend solo confirma que quedaron encoladas: duplicar la semilla en
      // Moodle (backup+restore) puede tardar varios minutos con 10-15 copias en
      // una corrida, así que no espera a que Moodle termine para responder. El
      // resultado real de cada curso llega por el polling de refreshCourses
      // mientras haya filas en "Sincronizando".
      await axios.post(`${BASE}/courses/sync`, { items }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const queuedIds = new Set(items.map(i => i.id))
      setCourses(prev => prev.map(c => queuedIds.has(c.id) ? { ...c, estado_sync: 'sincronizando' } : c))
      setSelected({})
      setBulkRuleId('')
    } catch (e) {
      console.error('Error sincronizando cursos:', e.message)
      alert('Error al sincronizar: ' + e.message)
    }
    setSyncing(false)
  }

  const allPageSelected = paginated.length > 0 && paginated.every(c => selected[c.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Cursos Plataforma</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selectedCourses.length > 0 && (
            <select
              className="filter-select"
              value={bulkRuleId}
              onChange={e => setBulkRuleId(e.target.value)}
              title="Regla a aplicar a los cursos seleccionados. Déjala en 'Automática' para que cada curso resuelva la suya por código/programa/departamento."
            >
              <option value="">Regla automática (por código/programa/departamento)</option>
              {reglas.filter(r => r.activo).map(r => (
                <option key={r.id} value={r.id}>
                  {(r.codigo_asignatura || r.programa || r.departamento) ? `${r.codigo_asignatura || r.programa || r.departamento} → ` : ''}
                  {r.seed_shortname} (cat. {r.categoryid})
                </option>
              ))}
            </select>
          )}
          <button className="btn-primary" onClick={handleSync} disabled={selectedCourses.length === 0 || syncing}>
            <RefreshCw size={15} />
            {syncing ? 'Sincronizando...' : `Sincronizar (${selectedCourses.length})`}
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por nombre, código, profesor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterPeriodo} onChange={e => { setFilterPeriodo(e.target.value); setPage(1) }}>
          <option value="">Todos los periodos</option>
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterDepto} onChange={e => { setFilterDepto(e.target.value); setPage(1) }}>
          <option value="">Todos los departamentos</option>
          {deptos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={filterSync} onChange={e => { setFilterSync(e.target.value); setPage(1) }}>
          <option value="">Todos</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="sincronizando">Sincronizando</option>
          <option value="error">Error</option>
          <option value="novedad">Novedad</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando cursos...</div>
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
                {paginated.map(course => (
                  <Fragment key={course.id}>
                    <tr className={selected[course.id] ? 'row-selected' : ''}>
                      <td><input type="checkbox" checked={!!selected[course.id]} onChange={() => toggleSelect(course.id)} /></td>
                      {COLUMNS.map(col => <td key={col.key}>{course[col.key] || '-'}</td>)}
                      <td><StatusBadge row={course} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(course.id)} title="Ver detalles">
                            {expandedRows[course.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[course.id] && (
                      <tr className="expand-row">
                        <td colSpan={COLUMNS.length + 3}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Código Asignatura</span>
                                <span className="expand-value">{course.codigo_asignatura || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Grupo</span>
                                <span className="expand-value">{course.grupo || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Plantilla</span>
                                <span className="expand-value">{course.templatecourse || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha Inicio</span>
                                <span className="expand-value">{course.fecha_inicio ? String(course.fecha_inicio).split('T')[0] : '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha Fin</span>
                                <span className="expand-value">{course.fecha_fin ? String(course.fecha_fin).split('T')[0] : '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Moodle ID</span>
                                <span className="expand-value">{course.moodle_id || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Link del curso en Moodle</span>
                                <span className="expand-value">
                                  {course.moodle_course_url
                                    ? <a href={course.moodle_course_url} target="_blank" rel="noopener noreferrer" className="expand-link">
                                        Abrir en Moodle <ExternalLink size={12} />
                                      </a>
                                    : '-'}
                                </span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Categoría (regla aplicada)</span>
                                <span className="expand-value">{course.categoryid || 'Sin aplicar todavía'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha recibido (SICAU)</span>
                                <span className="expand-value">{course.created_at ? String(course.created_at).split('T')[0] : '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha sincronizado</span>
                                <span className="expand-value">{course.synced_at ? String(course.synced_at).split('T')[0] : '-'}</span>
                              </div>
                              {course.estado_sync === 'error' && course.ultimo_error_sync && (
                                <div className="expand-item">
                                  <span className="expand-label">Último error de sincronización</span>
                                  <span className="expand-value">{course.ultimo_error_sync}</span>
                                </div>
                              )}
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