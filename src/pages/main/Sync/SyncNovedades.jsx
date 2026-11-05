import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import Paginacion from '../../../components/Paginacion'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import ExportMenu from '../../../components/ExportMenu'
import { ChevronDown, ChevronUp, RefreshCw, Search, UserX, GraduationCap, BookOpen, Users } from 'lucide-react'
import { fetchEnrollments } from '../../../services/matriculas/fetchEnrollments'
import { syncEnrollments } from '../../../services/matriculas/syncEnrollments'
import { getCached, setCached } from '../../../services/swrCache'
import "../../../styles/main/Sync/SyncMatriculas.css"
import { useNavigate, useSearchParams } from 'react-router-dom'
import NovedadesSicau from './NovedadesSicau'
import NovedadesUsuarios from './NovedadesUsuarios'
import { fetchSicauNovedades } from '../../../services/matriculas/fetchSicauNovedades'
import { nombreCambioEstado, esEstadoDeNovedad, nombreNovedadSicau, claseNovedad, TIPOS_SICAU_CONOCIDOS } from './novedadNombres'

// Misma key que Sync Matrículas: mismo preview de matrículas exactamente.
const CACHE_KEY = 'enrollments-preview'

const ROLE_LABEL = {
  student:        'Estudiante',
  editingteacher: 'Profesor',
  teacher:        'Tutor'
}

// Mismos estados que el motor de sync (services/sync/syncEnrollments.js) trata
// como matrícula activa/normal: una fila en alguno de estos estados no es una
// novedad y no debe aparecer aquí, aunque el usuario diga "distinto de
// Matriculado" en general (SICAU también manda "Activa" como sinónimo).
const ESTADOS_ACTIVOS = ['matriculado', 'matriculada', 'activa']

function normEstado(estado) {
  return (estado || '').trim().toLowerCase()
}

// Cambio de grupo: marcado 'traslado' mientras está pendiente; ya sincronizado
// conserva solo el estado interno "Trasladado".
function esCambioDeGrupo(enr) {
  return enr.estado_sync === 'traslado' || normEstado(enr.estado) === 'trasladado'
}

// Nombre de la novedad con el vocabulario de SICAU. La detección sigue siendo
// la de Nexo (estado); lo que reportó SICAU solo se usa para nombrar lo que
// Nexo no puede saber: que una desmatrícula vino de un RETIRO del curso, o un
// tipo de novedad nuevo que SICAU empiece a mandar.
function tipoNovedad(enr, sicau) {
  if (esCambioDeGrupo(enr))                  return 'Cambio de grupo'
  if (enr.estado_sync === 'desmatriculando') return 'Desmatriculando'
  const estado = normEstado(enr.estado)
  if (estado === 'desmatriculado') return sicau.retirosCurso.has(enr.codigo_journey) ? 'Retiro de curso' : 'Desmatriculado'
  const reportada = sicau.porMatricula[`${enr.documento}|${enr.codigo_journey}`]
  if (reportada && !TIPOS_SICAU_CONOCIDOS.includes(reportada.tipo)) return nombreNovedadSicau(reportada)
  if (esEstadoDeNovedad(estado)) return nombreCambioEstado(estado)
  if (estado === 'pendiente') return 'Pendiente'
  return enr.estado || 'Otro'
}

// Para un traslado, busca entre TODAS las matrículas (no solo las filtradas)
// la fila hermana del mismo estudiante+asignatura+periodo que quedó activa:
// esa es el curso nuevo al que se movió. saveSicauMatricula (SICAU/controller.js)
// no guarda un enlace directo entre la matrícula vieja y la nueva, así que se
// reconstruye por descarte igual que hace el backend al detectar el traslado.
function findCursoNuevo(enr, all) {
  if (!esCambioDeGrupo(enr)) return null
  const match = all.find(o =>
    o.id !== enr.id && o.userid === enr.userid &&
    o.codigo_asignatura === enr.codigo_asignatura && o.periodo === enr.periodo &&
    ESTADOS_ACTIVOS.includes(normEstado(o.estado))
  )
  return match?.codigo_journey || null
}

// Detecta estudiantes matriculados y ACTIVOS a la vez en dos (o más) grupos de
// la misma asignatura y periodo (mismo codigo_asignatura, distinto codigo_journey
// por el grupo) — a diferencia de un traslado, aquí ninguna de las dos quedó
// marcada como "Trasladado": ambas siguen "Matriculado" en SICAU, lo que
// normalmente es un error de origen (el estudiante no debería estar dos veces
// en la misma materia el mismo periodo) y hay que revisarlo a mano. Se agrupa
// por userid+codigo_asignatura+periodo entre TODAS las matrículas activas y se
// marca cada fila que comparte grupo con al menos otra.
function findDuplicadosPorGrupo(all) {
  const grupos = {}
  all.forEach(e => {
    // Solo estudiantes: un profesor/tutor sí puede estar activo a la vez en
    // varios grupos de la misma asignatura y periodo (dicta más de un grupo),
    // eso no es un error de matrícula como sí lo es para un estudiante.
    if (e.role !== 'student') return
    if (!ESTADOS_ACTIVOS.includes(normEstado(e.estado))) return
    const key = `${e.userid}|${e.codigo_asignatura}|${e.periodo}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(e)
  })
  const duplicados = {}
  Object.values(grupos).forEach(list => {
    if (list.length <= 1) return
    list.forEach(e => {
      duplicados[e.id] = list.filter(o => o.id !== e.id).map(o => o.codigo_journey)
    })
  })
  return duplicados
}

const COLUMNS = [
  { key: 'codigo_journey',      label: 'Código Nexo' },
  { key: 'nombre_asignatura',   label: 'Asignatura' },
  { key: 'nombre',              label: 'Nombre' },
  { key: 'periodo',             label: 'Período' },
  { key: 'estado',              label: 'Estado' },
  { key: 'fecha_cambio_estado', label: 'Fecha' },
]

// Texto de cada columna tal como se ve en la celda (para el filtro por columna).
const COL_GETTERS = Object.fromEntries(COLUMNS.map(col => [col.key, r =>
    col.key === 'fecha_cambio_estado' ? (r.fecha_cambio_estado ? String(r.fecha_cambio_estado).split('T')[0] : '-')
    : col.key === 'estado' ? (esCambioDeGrupo(r) ? 'Desmatriculado' : (r.estado || '-'))
    : (r[col.key] || '-')]))

function NovedadBadge({ enr }) {
  const tipo = enr._tipoNovedad
  return <span className={`badge novedad-badge ${claseNovedad(tipo)}`} title={enr._duplicadoCon ? `También matriculado en: ${enr._duplicadoCon.join(', ')}` : ''}>{tipo}</span>
}

function StatusBadge({ row }) {
  if (row._syncing) return <span className="badge badge-syncing">Sincronizando...</span>
  if (row._status === 'error' || row.estado_sync === 'error')
    return <span className="badge badge-error" title={row.ultimo_error_sync || ''}>Error</span>
  if (!row.userExistsInMoodle)     return <span className="badge badge-no-user">Usuario no existe en Moodle</span>
  if (row.estado_sync === 'desmatriculando')
    return <span className="badge badge-syncing" title="Moodle puede tardar 1-2 min en aplicar la baja; vuelve a sincronizar en un momento">Desmatriculando...</span>
  if (row._syncStatus?.inMoodle)   return <span className="badge badge-synced">Sincronizado</span>
  if (row.sincronizado)            return <span className="badge badge-db">Solo en BD</span>
  return <span className="badge badge-pending">Pendiente</span>
}

export default function SyncNovedades() {
  const navigate = useNavigate()

  const [allEnrollments, setAllEnrollments] = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]               = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]               = useState(false)
  const [search, setSearch]                 = useState('')
  const [filterPeriodo, setFilterPeriodo]   = useState('')
  const [filterTipo, setFilterTipo]         = useState('')
  const [filterSync, setFilterSync]         = useState('')
  const [sortKey, setSortKey]               = useState('fecha_cambio_estado')
  const [sortDir, setSortDir]               = useState('desc')
  const [expandedRows, setExpandedRows]     = useState({})
  const [selected, setSelected]             = useState({})
  const [page, setPage]                     = useState(1)
  const [perPage, setPerPage] = useState(10)
  // ?tab=sicau abre directo esa pestaña (link de la notificación de SICAU en la
  // campanita); si ya estaba en esta página y cambia la URL, también la sigue.
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam || 'nexo')
  const [prevTabParam, setPrevTabParam] = useState(tabParam)
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam)
    if (tabParam) setTab(tabParam)
  }
  const loadEnrollments = useCallback(async () => {
    try {
      const data = await fetchEnrollments()
      setCached(CACHE_KEY, data)
      setAllEnrollments(data)
    } catch (err) {
      console.error('Error cargando novedades:', err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  // Lo que reportó SICAU, solo para nombrar novedades (ver tipoNovedad).
  // Best-effort: si falla, la página sigue con los nombres derivados del estado.
  const [sicauNovedades, setSicauNovedades] = useState([])
  useEffect(() => {
    fetchSicauNovedades().then(setSicauNovedades).catch(() => {})
  }, [])
  const sicau = useMemo(() => {
    const retirosCurso = new Set()
    const porMatricula = {}
    // Vienen de la más reciente a la más vieja: gana la última reportada.
    sicauNovedades.forEach(n => {
      if (n.nivel === 'curso' && n.tipo === 'RETIRO') retirosCurso.add(n.codigo_journey)
      const key = `${n.cedula}|${n.codigo_journey}`
      if (n.nivel === 'matricula' && !porMatricula[key]) porMatricula[key] = n
    })
    return { retirosCurso, porMatricula }
  }, [sicauNovedades])

  // Novedades = cualquier matrícula que no esté en un estado activo normal, MÁS
  // las que sí están "Matriculado" pero duplicadas en dos grupos de la misma
  // asignatura/periodo (esas no cambian de estado, así que no las agarra el
  // filtro de arriba; se agregan aparte).
  const duplicados = useMemo(() => findDuplicadosPorGrupo(allEnrollments), [allEnrollments])
  const novedades = useMemo(
    () => allEnrollments
      .filter(e => !ESTADOS_ACTIVOS.includes(normEstado(e.estado)) || duplicados[e.id])
      .map(e => ({
        ...e,
        _duplicadoCon: duplicados[e.id] || null,
        _tipoNovedad: duplicados[e.id] ? 'Duplicado (2 grupos)' : tipoNovedad(e, sicau),
        _cursoNuevo: findCursoNuevo(e, allEnrollments)
      })),
    [allEnrollments, duplicados, sicau]
  )

  const periodos = [...new Set(novedades.map(e => e.periodo).filter(Boolean))]
  const tipos    = [...new Set(novedades.map(e => e._tipoNovedad).filter(Boolean))]

  const baseFiltered = useMemo(() => {
    let data = [...novedades]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e => Object.values(e).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterPeriodo) data = data.filter(e => e.periodo === filterPeriodo)
    if (filterTipo)    data = data.filter(e => e._tipoNovedad === filterTipo)
    if (filterSync === 'sincronizado')    data = data.filter(e => e._syncStatus?.inMoodle)
    if (filterSync === 'pendiente')       data = data.filter(e => !e.sincronizado)
    if (filterSync === 'error')           data = data.filter(e => e.estado_sync === 'error')
    if (filterSync === 'desmatriculando') data = data.filter(e => e.estado_sync === 'desmatriculando')
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [novedades, search, filterPeriodo, filterTipo, filterSync, sortKey, sortDir])

  // Filtros por columna (estilo Excel) sobre lo que ya dejó pasar la barra de filtros.
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(baseFiltered, COL_GETTERS, () => setPage(1))

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

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

  const selectedItems = novedades.filter(e => selected[e.id])

  const handleSync = async () => {
    if (selectedItems.length === 0) return
    setSyncing(true)
    const syncingIds = new Set(selectedItems.map(e => e.id))
    setAllEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: true } : e))
    try {
      await syncEnrollments(selectedItems)
      await loadEnrollments()
      setSelected({})
    } catch (err) {
      console.error('Error sincronizando novedades:', err.message)
      setAllEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: false } : e))
    }
    setSyncing(false)
  }

  const allPageSelected = paginated.length > 0 && paginated.every(e => selected[e.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Novedades</h2>
        {tab === 'nexo' && (
          <button className="btn-primary" onClick={handleSync} disabled={selectedItems.length === 0 || syncing}>
            <RefreshCw size={15} />
            {syncing ? 'Sincronizando...' : `Sincronizar (${selectedItems.length})`}
          </button>
        )}
      </div>

      <div className="novedades-tabs" role="tablist" aria-label="Origen de la novedad">
        <button type="button" role="tab" aria-selected={tab === 'nexo'} className={tab === 'nexo' ? 'active' : ''} onClick={() => setTab('nexo')}>
          <GraduationCap size={15} aria-hidden="true" /> Novedades de Matrículas
        </button>
        <button type="button" role="tab" aria-selected={tab === 'sicau'} className={tab === 'sicau' ? 'active' : ''} onClick={() => setTab('sicau')}>
          <BookOpen size={15} aria-hidden="true" /> Novedades de cursos
        </button>
        <button type="button" role="tab" aria-selected={tab === 'usuarios'} className={tab === 'usuarios' ? 'active' : ''} onClick={() => setTab('usuarios')}>
          <Users size={15} aria-hidden="true" /> Novedades de Usuarios
        </button>
      </div>

      {tab === 'sicau' ? <NovedadesSicau /> : tab === 'usuarios' ? <NovedadesUsuarios /> : (<>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
        Matrículas cuyo estado cambió y ya no es "Matriculado": traslados de grupo/curso, cancelaciones,
        retiros, finalizaciones y suspensiones. Selecciona filas y sincroniza para aplicar el cambio en Moodle
        desde Nexo — un traslado desmatricula del curso viejo y matricula en el nuevo; una cancelación deja al
        estudiante suspendido en el curso sin desmatricularlo.
      </p>

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
        <select className="filter-select" value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1) }}>
          <option value="">Todos los tipos de novedad</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterSync} onChange={e => { setFilterSync(e.target.value); setPage(1) }}>
          <option value="">Todos</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="pendiente">Pendiente</option>
          <option value="error">Error</option>
          <option value="desmatriculando">Desmatriculando...</option>
        </select>
        {anyFilter && <button className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
        <ExportMenu title="Novedades" columns={COLUMNS.map(c => ({ label: c.label, get: COL_GETTERS[c.key] }))} rows={filtered} allRows={novedades} selectedRows={novedades.filter(r => selected[r.id])} />
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando novedades...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={allPageSelected} onChange={selectAll} /></th>
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
                  <th>Novedad</th>
                  <th>Sync</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={COLUMNS.length + 4} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No hay novedades pendientes.</td></tr>
                )}
                {paginated.map(enr => (
                  <Fragment key={enr.id}>
                    <tr className={selected[enr.id] ? 'row-selected' : ''}>
                      <td data-label="Seleccionar"><input type="checkbox" checked={!!selected[enr.id]} onChange={() => toggleSelect(enr.id)} /></td>
                      {COLUMNS.map(col => (
                        <td data-label={col.label} key={col.key}>
                          {col.key === 'codigo_journey'
                            ? <span className="codigo-journey">{enr[col.key] || '-'}</span>
                            : col.key === 'fecha_cambio_estado'
                            ? <span style={{ whiteSpace: 'nowrap' }}>{enr.fecha_cambio_estado ? String(enr.fecha_cambio_estado).split('T')[0] : '-'}</span>
                            // Un cambio de grupo guarda estado interno "Trasladado", pero en
                            // ese curso el efecto real es que quedó desmatriculado; se muestra
                            // así y se indica a qué curso pasó.
                            // Estado anterior → actual en una sola celda para que la
                            // tabla quepa sin scroll horizontal.
                            : col.key === 'estado'
                            ? <>
                                <span className="novedades-sicau-sub">{enr.estado_anterior || '-'} →</span>{' '}
                                {esCambioDeGrupo(enr) ? 'Desmatriculado' : (enr.estado || '-')}
                                {esCambioDeGrupo(enr) && enr._cursoNuevo && <div className="novedades-sicau-sub">Pasó a {enr._cursoNuevo}</div>}
                              </>
                            : enr[col.key] || '-'}
                        </td>
                      ))}
                      <td data-label="Novedad"><NovedadBadge enr={enr} /></td>
                      <td data-label="Sync"><StatusBadge row={enr} /></td>
                      <td data-label="Acciones">
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
                        <td colSpan={COLUMNS.length + 4}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Documento</span>
                                <span className="expand-value">{enr.documento || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Email</span>
                                <span className="expand-value">{enr.email || '-'}</span>
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
                                <span className="expand-label">Grupo (curso viejo)</span>
                                <span className="expand-value">{enr.grupo || '-'}</span>
                              </div>
                              {enr._cursoNuevo && (
                                <div className="expand-item">
                                  <span className="expand-label">Curso nuevo</span>
                                  <span className="expand-value">{enr._cursoNuevo}</span>
                                </div>
                              )}
                              {enr._duplicadoCon && (
                                <div className="expand-item" style={{ gridColumn: '1 / -1' }}>
                                  <span className="expand-label">También matriculado y activo en</span>
                                  <span className="expand-value">{enr._duplicadoCon.join(', ')} (misma asignatura {enr.codigo_asignatura}, mismo periodo)</span>
                                </div>
                              )}
                              {enr.ultimo_error_sync && (
                                <div className="expand-item">
                                  <span className="expand-label">Último error de sync</span>
                                  <span className="expand-value">{enr.ultimo_error_sync}</span>
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

          <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
        </>
      )}
      </>)}
    </div>
  )
}
