import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { useLocation } from 'react-router-dom'
import Paginacion from '../../../components/Paginacion'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import ExportMenu from '../../../components/ExportMenu'
import { ChevronDown, ChevronUp, Search, RefreshCw, BookPlus, UploadCloud, FlagOff } from 'lucide-react'
import { fetchCourses } from '../../../services/cursos/fetchCourses'
import { createCourseManual } from '../../../services/cursos/createCourseManual'
import { pushCourseUpdate } from '../../../services/cursos/pushCourseUpdate'
import { finalizeCourseEnrollments } from '../../../services/cursos/finalizeCourseEnrollments'
import { fetchMoodleCategorias } from '../../../services/admin/fetchMoodleCategorias'
import { fetchMoodleSemillas } from '../../../services/admin/fetchMoodleSemillas'
import { getCached, setCached } from '../../../services/swrCache'
import { alertError, confirmAccion, confirmGuardarCambios, toastExito } from '../../../services/alerts'
import { humanize } from '../Sync/novedadNombres'
import "../../../styles/main/Sync/SyncUsuariosP.css"

const CACHE_KEY = 'courses-list'

function StatusBadge({ row }) {
  if (row.estado_sync === 'novedad')     return <span className="badge badge-novedad" title={row.ultimo_error_sync || ''}>Novedad</span>
  if (row.estado_sync === 'sincronizando') return <span className="badge badge-pending">Actualizando...</span>
  return <span className="badge badge-synced">Sincronizado</span>
}

const COLUMNS = [
  { key: 'fullname',     label: 'Nombre Completo' },
  { key: 'shortname',    label: 'Nombre Corto' },
  { key: 'idnumber',     label: 'Código' },
  { key: 'nombre_profesor', label: 'Profesor' },
  { key: 'periodo',      label: 'Periodo' },
  { key: 'moodle_id',    label: 'Moodle ID' },
]

// Texto de cada columna tal como se ve en la celda (para el filtro por columna).
const COL_GETTERS = Object.fromEntries(COLUMNS.map(col => [col.key, r => r[col.key] || '-']))

const EMPTY_FORM = {
  seed_shortname: '', categoryid: '', fullname: '', shortname: '', idnumber: '',
  nombre_profesor: '', periodo: '', grupo: '', departamento: '', programa: '',
  codigo_asignatura: '', nombre_asignatura: '', fecha_inicio: '', fecha_fin: ''
}

function CreateCourseModal({ onClose, onSave }) {
  const [form, setForm]         = useState(EMPTY_FORM)
  const [categorias, setCategorias] = useState([])
  const [semillas, setSemillas]     = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([fetchMoodleCategorias(), fetchMoodleSemillas()])
      .then(([cats, seeds]) => { setCategorias(cats); setSemillas(seeds) })
      .catch(e => setError(e.message))
      .finally(() => setLoadingCatalog(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.seed_shortname || !form.categoryid || !form.fullname || !form.shortname) {
      setError('Semilla, categoría, nombre completo y nombre corto son obligatorios.')
      return
    }
    const decision = await confirmGuardarCambios({ title: '¿Guardar el curso nuevo?' })
    if (decision === 'cancel') return
    if (decision === 'discard') { onClose(); return }
    setSaving(true)
    setError('')
    try {
      await createCourseManual({ ...form, categoryid: Number(form.categoryid) })
      onSave()
      onClose()
      toastExito('Curso creado')
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Crear Curso</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          {loadingCatalog ? (
            <div className="loading-box"><span className="loader"></span>Consultando Moodle...</div>
          ) : (
            <>
              <div className="modal-section-title">Semilla y Categoría *</div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Curso semilla *</label>
                  <select name="seed_shortname" value={form.seed_shortname} onChange={handleChange}>
                    <option value="">Selecciona una semilla...</option>
                    {semillas.map(s => (
                      <option key={s.id} value={s.shortname}>{s.shortname} — {s.fullname}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Categoría destino *</label>
                  <select name="categoryid" value={form.categoryid} onChange={handleChange}>
                    <option value="">Selecciona una categoría...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (id {c.id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-section-title">Identificación del Curso *</div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Nombre completo *</label>
                  <input name="fullname" value={form.fullname} onChange={handleChange} placeholder="G105 Algebra Lineal (FB0010) - Profesor: ... (2026-1)" />
                </div>
                <div className="modal-field">
                  <label>Nombre corto *</label>
                  <input name="shortname" value={form.shortname} onChange={handleChange} placeholder="G105 Algebra Lineal (FB0010)(2026-1)" />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Código (idnumber)</label>
                  <input name="idnumber" value={form.idnumber} onChange={handleChange} placeholder="FB001020261G105" />
                </div>
                <div className="modal-field">
                  <label>Profesor</label>
                  <input name="nombre_profesor" value={form.nombre_profesor} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-section-title">Datos Académicos</div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Periodo</label>
                  <input name="periodo" value={form.periodo} onChange={handleChange} placeholder="20261" />
                </div>
                <div className="modal-field">
                  <label>Grupo</label>
                  <input name="grupo" value={form.grupo} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Departamento</label>
                  <input name="departamento" value={form.departamento} onChange={handleChange} />
                </div>
                <div className="modal-field">
                  <label>Programa</label>
                  <input name="programa" value={form.programa} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Código Asignatura</label>
                  <input name="codigo_asignatura" value={form.codigo_asignatura} onChange={handleChange} />
                </div>
                <div className="modal-field">
                  <label>Nombre Asignatura</label>
                  <input name="nombre_asignatura" value={form.nombre_asignatura} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-section-title">Fechas</div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Fecha Inicio</label>
                  <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} />
                </div>
                <div className="modal-field">
                  <label>Fecha Fin</label>
                  <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} />
                </div>
              </div>
              <p className="modal-hint">El curso se duplica de la semilla elegida y queda sincronizado de inmediato.</p>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || loadingCatalog}>
            {saving ? 'Creando...' : 'Crear Curso'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModulosCursos() {
  const location = useLocation()
  const [courses, setCourses]     = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]     = useState(() => !getCached(CACHE_KEY))
  // Llega desde Búsqueda (navigate con state.q) para dejar el resultado elegido ya filtrado.
  const [search, setSearch]       = useState(() => location.state?.q || '')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterDepto, setFilterDepto]     = useState('')
  const [sortKey, setSortKey]     = useState('fullname')
  const [sortDir, setSortDir]     = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [page, setPage]           = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const refreshCourses = useCallback(async () => {
    try {
      const data = await fetchCourses()
      setCached(CACHE_KEY, data)
      setCourses(data)
    } catch (e) {
      console.error('Error cargando cursos:', e.message)
    }
  }, [])

  // Usada por el botón "Recargar": ahí sí se espera ver el spinner, es una
  // acción explícita del usuario.
  const loadCourses = useCallback(async () => {
    setLoading(true)
    await refreshCourses()
    setLoading(false)
  }, [refreshCourses])

  // Carga inicial: si ya hay caché no se muestra spinner, solo se refresca
  // por debajo.
  useEffect(() => { refreshCourses().then(() => setLoading(false)) }, [refreshCourses])

  // Mientras se empuja la actualización de un curso con "novedad" a Moodle,
  // se refresca solo para ver cuándo pasa a sincronizado, sin recargar todo.
  const hasSyncingRows = courses.some(c => c.estado_sync === 'sincronizando')
  useEffect(() => {
    if (!hasSyncingRows) return
    const interval = setInterval(refreshCourses, 4000)
    return () => clearInterval(interval)
  }, [hasSyncingRows, refreshCourses])

  const handlePushUpdate = async (course) => {
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, estado_sync: 'sincronizando' } : c))
    try {
      await pushCourseUpdate(course)
      toastExito('Curso actualizado en Moodle')
    } catch (e) {
      console.error('Error actualizando curso en Moodle:', e.message)
      alertError('Error al actualizar el curso en Moodle: ' + e.message)
    }
    refreshCourses()
  }

  const [finalizingId, setFinalizingId] = useState(null)

  const handleFinalizeEnrollments = async (course) => {
    const ok = await confirmAccion({
      title: '¿Cerrar el semestre de este curso?',
      text: `Las matrículas activas de "${course.fullname || course.shortname}" pasarán a Finalizado. Moodle las desmatricula sola en el próximo cron (vía BD externa); no se puede deshacer desde aquí.`,
      confirmButtonText: 'Sí, cerrar semestre',
    })
    if (!ok) return
    setFinalizingId(course.id)
    try {
      const result = await finalizeCourseEnrollments(course.id)
      toastExito(`${result.finalizadas} matrícula(s) finalizada(s)`)
    } catch (e) {
      console.error('Error cerrando el semestre del curso:', e.message)
      alertError(e.message)
    }
    setFinalizingId(null)
  }

  const baseFiltered = useMemo(() => {
    let data = [...courses]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(c => Object.values(c).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterPeriodo) data = data.filter(c => c.periodo === filterPeriodo)
    if (filterDepto)   data = data.filter(c => c.departamento === filterDepto)
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [courses, search, filterPeriodo, filterDepto, sortKey, sortDir])

  // Filtros por columna (estilo Excel) sobre lo que ya dejó pasar la barra de filtros.
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(baseFiltered, COL_GETTERS, () => setPage(1))

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)
  const periodos   = [...new Set(courses.map(c => c.periodo).filter(Boolean))]
  const deptos     = [...new Set(courses.map(c => c.departamento).filter(Boolean))]

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Módulo Cursos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={loadCourses} disabled={loading}>
            <RefreshCw size={15} /> Recargar
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <BookPlus size={15} /> Crear Curso
          </button>
        </div>
      </div>

      <p className="permisos-intro">
        Cursos ya creados en Moodle. Los pendientes o con error se gestionan en Sync Cursos. Si SICAU
        reporta un cambio (p.ej. de profesor) en un curso que ya existe aquí, aparece en amarillo como
        "Novedad" con un botón para empujar la actualización a Moodle.
      </p>

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
        {anyFilter && <button className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
        <ExportMenu title="Módulo Cursos" columns={COLUMNS.map(c => ({ label: c.label, get: COL_GETTERS[c.key] }))} rows={filtered} allRows={courses} />
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
                  {COLUMNS.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                      <ColumnFilter {...colProps(col.key)}>
                        {col.label}
                        {sortKey === col.key
                          ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                      </ColumnFilter>
                    </th>
                  ))}
                  <th>Estado</th>
                  <th style={{ width: 140 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={COLUMNS.length + 2} style={{ textAlign: 'center', color: '#94a3b8' }}>No hay cursos sincronizados todavía.</td></tr>
                )}
                {paginated.map(course => (
                  <Fragment key={course.id}>
                    <tr>
                      {COLUMNS.map(col => <td data-label={col.label} key={col.key}>{course[col.key] || '-'}</td>)}
                      <td data-label="Estado"><StatusBadge row={course} /></td>
                      <td data-label="Acciones">
                        <div className="action-btns">
                          {course.estado_sync === 'novedad' && (
                            <button
                              className="btn-icon"
                              onClick={() => handlePushUpdate(course)}
                              title="Actualizar metadata en Moodle (fullname/profesor)"
                            >
                              <UploadCloud size={14} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleFinalizeEnrollments(course)}
                            disabled={finalizingId === course.id}
                            title="Cerrar semestre: finaliza las matrículas activas de este curso"
                          >
                            <FlagOff size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => toggleExpand(course.id)} title="Ver más">
                            {expandedRows[course.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[course.id] && (
                      <tr className="expand-row">
                        <td colSpan={COLUMNS.length + 2}>
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
                                <span className="expand-label">Departamento</span>
                                <span className="expand-value">{course.departamento || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Programa</span>
                                <span className="expand-value">{course.programa || '-'}</span>
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
                                <span className="expand-label">Categoría</span>
                                <span className="expand-value">{course.categoryid || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Plantilla (semilla)</span>
                                <span className="expand-value">{course.templatecourse || '-'}</span>
                              </div>
                            </div>

                            {course.novedad_datos?.length > 0 && (
                              <div className="novedad-section">
                                <div className="novedad-section-title">Última novedad reportada por SICAU</div>
                                <ul className="novedad-datos-list">
                                  {course.novedad_datos.map((c, i) => (
                                    <li key={i}>{humanize(c.campo)}: {c.anterior ?? '—'} → {c.actual ?? '—'}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
        </>
      )}

      {showCreate && (
        <CreateCourseModal onClose={() => setShowCreate(false)} onSave={loadCourses} />
      )}
    </div>
  )
}
