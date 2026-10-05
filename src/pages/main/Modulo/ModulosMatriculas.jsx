import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react'
import Paginacion from '../../../components/Paginacion'
import { ChevronDown, ChevronUp, Pencil, Trash2, RefreshCw, Search, UserPlus, BookOpen } from 'lucide-react'
import { fetchEnrollmentsList } from '../../../services/matriculas/fetchEnrollmentsList'
import { syncEnrollments } from '../../../services/matriculas/syncEnrollments'
import { createEnrollment } from '../../../services/matriculas/createEnrollment'
import { updateEnrollment } from '../../../services/matriculas/updateEnrollment'
import { deleteEnrollment } from '../../../services/matriculas/deleteEnrollment'
import { searchUsers } from '../../../services/usuarios/searchUsers'
import { getCached, setCached } from '../../../services/swrCache'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Modulo/ModulosMatriculas.css"

const CACHE_KEY = 'enrollments-list'

const ROLE_OPTIONS = [
  { value: 'gestor',         label: 'Gestor' },
  { value: 'editingteacher', label: 'Editing Teacher' },
  { value: 'teacher',        label: 'Teacher' },
  { value: 'student',        label: 'Student' },
  { value: 'revisor',        label: 'Revisor' },
]

// Equivalencia con los roles reales de Moodle (roleid que espera el sync:
// student=5, editingteacher=3, teacher=4 = "Non-editing Teacher"). "Gestor"
// y "Revisor" son roles internos de Journey sin equivalente en Moodle.
const ROLE_MOODLE_HINT = {
  gestor:         'Sin rol en Moodle (uso interno)',
  editingteacher: 'Moodle: Editing Teacher',
  teacher:        'Moodle: Teacher / Non-editing Teacher',
  student:        'Moodle: Student',
  revisor:        'Sin rol en Moodle (uso interno)',
}

// "Trasladado" queda fuera a propósito: no es un valor que SICAU mande, lo
// calcula Nexo solo al detectar el traslado (ver saveEnrollmentConNovedades
// en api/enrollments/controller.js) — no tiene sentido elegirlo a mano. Los
// demás sí son valores reales que SICAU puede mandar en su campo `estado`, así
// que se dejan disponibles aquí por si hay que crear o corregir una matrícula
// a mano con ese mismo estado.
const ESTADO_ACADEMICO_OPTIONS = ['Matriculado', 'Suspendido', 'Cancelado', 'Finalizado', 'Pendiente']

// Con el sync por BD externa (ver database/seeds/fixMoodleExternalDbViews.js)
// cualquier estado que no sea "Matriculado" simplemente desaparece de la vista
// moodle_enrol, y Moodle aplica su unenrolaction configurada ("Desmatricular
// al usuario del curso") por igual para los cuatro — ya no hay distinción
// entre suspender y desmatricular como en el webservice viejo.
const ESTADO_MOODLE_HINT = {
  Matriculado: 'Moodle: Active — se matricula por BD externa en el próximo cron.',
  Suspendido:  'Moodle: se desmatricula por BD externa en el próximo cron.',
  Cancelado:   'Moodle: se desmatricula por BD externa en el próximo cron.',
  Finalizado:  'Moodle: se desmatricula por BD externa en el próximo cron.',
  Pendiente:   'Aún no se sincroniza con Moodle.',
}

const EMPTY_FORM = {
  userid: '', studentLabel: '', role: 'student',
  codigo_asignatura: '', nombre_asignatura: '', grupo: '', periodo: '', programa: '',
  estado: 'Matriculado', codigo_journey: ''
}

function StatusBadge({ row, syncResult }) {
  if (row._syncing) return <span className="badge badge-syncing">Sincronizando...</span>
  if (syncResult?.status === 'error' || row.estado_sync === 'error')
    return <span className="badge badge-error" title={row.ultimo_error_sync || ''}>Error</span>
  if (syncResult?.status === 'usuario_no_existe') return <span className="badge badge-no-user">Usuario no existe en Moodle</span>
  if (syncResult?.status === 'pendiente') return <span className="badge badge-pending">Pendiente</span>
  if (syncResult?.status === 'desmatriculando' || row.estado_sync === 'desmatriculando')
    return <span className="badge badge-syncing" title={syncResult?.message || 'Moodle puede tardar 1-2 min en aplicar la baja'}>Desmatriculando...</span>
  if (row.estado_sync === 'traslado')
    return <span className="badge badge-novedad" title="El estudiante cambió de grupo/curso en SICAU; revisa esta matrícula">Duplicado</span>
  if (row.estado === 'Suspendido') return <span className="badge badge-suspended">Suspendido</span>
  return row.sincronizado
    ? <span className="badge badge-synced">Sincronizado</span>
    : <span className="badge badge-db">Solo en BD</span>
}

function StudentSearchSelect({ value, disabled, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onSelect(null, val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.trim().length < 2) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchUsers(val)
        setResults(data)
        setOpen(true)
      } catch (e) {
        console.error('Error buscando estudiantes:', e.message)
      }
    }, 300)
  }

  const pick = (u) => {
    const label = `${u.firstname || ''} ${u.lastname || ''} — ${u.documento || ''}`.trim()
    setQuery(label)
    setResults([])
    setOpen(false)
    onSelect(u, label)
  }

  return (
    <div className="searchable-select">
      <input
        value={query}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar por nombre o documento..."
      />
      {open && (
        <div className="searchable-select-dropdown">
          {results.length === 0
            ? <div className="searchable-select-empty">Sin resultados</div>
            : results.map(u => (
              <div key={u.id} className="searchable-select-option" onMouseDown={() => pick(u)}>
                {u.firstname} {u.lastname} — {u.documento}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function EnrollmentFormFields({ form, setForm, studentDisabled }) {
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <>
      <div className="modal-section-title">Datos del Estudiante *</div>
      <div className="modal-field">
        <label>Estudiante / Usuario *</label>
        <StudentSearchSelect
          value={form.studentLabel}
          disabled={studentDisabled}
          onSelect={(u, label) => setForm(f => ({ ...f, userid: u ? u.id : '', studentLabel: label }))}
        />
      </div>
      <div className="modal-field">
        <label>Rol *</label>
        <select name="role" value={form.role} onChange={handleChange}>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <span className="badge badge-moodle moodle-hint">{ROLE_MOODLE_HINT[form.role] || ''}</span>
      </div>

      <div className="modal-section-title">Información Académica *</div>
      <div className="modal-row">
        <div className="modal-field">
          <label>Código Asignatura *</label>
          <input name="codigo_asignatura" value={form.codigo_asignatura} onChange={handleChange} placeholder="MAT101" />
        </div>
        <div className="modal-field">
          <label>Nombre Asignatura *</label>
          <input name="nombre_asignatura" value={form.nombre_asignatura} onChange={handleChange} placeholder="Matemáticas I" />
        </div>
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label>Grupo *</label>
          <input name="grupo" value={form.grupo} onChange={handleChange} placeholder="01" />
        </div>
        <div className="modal-field">
          <label>Periodo *</label>
          <input name="periodo" value={form.periodo} onChange={handleChange} placeholder="2026-1" />
        </div>
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label>Programa Académico *</label>
          <input name="programa" value={form.programa} onChange={handleChange} placeholder="Ingeniería de Sistemas" />
        </div>
        <div className="modal-field">
          <label>Estado Académico *</label>
          <select name="estado" value={form.estado} onChange={handleChange}>
            {ESTADO_ACADEMICO_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            {form.estado && !ESTADO_ACADEMICO_OPTIONS.includes(form.estado) && (
              <option value={form.estado}>{form.estado} (actual — gestionado desde Sync)</option>
            )}
          </select>
          <span className="badge badge-moodle moodle-hint">{ESTADO_MOODLE_HINT[form.estado] || 'Cambios de estado distintos de "Matriculado" se gestionan desde Sync > Novedades.'}</span>
        </div>
      </div>

      <div className="modal-section-title">Integración con Moodle</div>
      <div className="modal-field">
        <label>Código Nexo</label>
        <input name="codigo_journey" value={form.codigo_journey} onChange={handleChange} placeholder="Se genera automáticamente si se deja vacío" />
        <p className="modal-hint">Es el identificador (idnumber) del curso en Moodle: con él se realiza la matrícula. Se calcula como Código Asignatura + Periodo + Grupo si no lo escribes.</p>
      </div>
      <p className="modal-hint">El estado inicial de la matrícula será "Solo en BD" hasta que se ejecute la sincronización.</p>
    </>
  )
}

function CreateEnrollmentModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.userid || !form.role || !form.codigo_asignatura || !form.nombre_asignatura || !form.grupo || !form.periodo || !form.programa) {
      setError('Estudiante, rol, código y nombre de asignatura, grupo, periodo y programa son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createEnrollment({
        userid: Number(form.userid),
        role: form.role,
        codigo_asignatura: form.codigo_asignatura,
        nombre_asignatura: form.nombre_asignatura,
        grupo: form.grupo,
        periodo: form.periodo,
        programa: form.programa,
        estado: form.estado,
        codigo_journey: form.codigo_journey || undefined
      })
      onSave()
      onClose()
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Crear Matrícula</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <EnrollmentFormFields form={form} setForm={setForm} studentDisabled={false} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Matrícula'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditEnrollmentModal({ enrollment, onClose, onSave }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    userid: enrollment.userid,
    studentLabel: `${enrollment.firstname || ''} ${enrollment.lastname || ''} — ${enrollment.documento || ''}`.trim(),
    role: enrollment.role || 'student',
    codigo_asignatura: enrollment.codigo_asignatura || '',
    nombre_asignatura: enrollment.nombre_asignatura || '',
    grupo: enrollment.grupo || '',
    periodo: enrollment.periodo || '',
    programa: enrollment.programa || '',
    estado: enrollment.estado || 'Matriculado',
    codigo_journey: enrollment.codigo_journey || ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.role || !form.codigo_asignatura || !form.nombre_asignatura || !form.grupo || !form.periodo || !form.programa) {
      setError('Rol, código y nombre de asignatura, grupo, periodo y programa son obligatorios.')
      return
    }
    try {
      await updateEnrollment(enrollment.id, {
        userid: form.userid,
        role: form.role,
        codigo_asignatura: form.codigo_asignatura,
        nombre_asignatura: form.nombre_asignatura,
        grupo: form.grupo,
        periodo: form.periodo,
        programa: form.programa,
        estado: form.estado,
        courseid: enrollment.courseid || null
      })
      onSave()
      onClose()
    } catch (e) {
      console.error('Error actualizando matrícula:', e.message)
      setError('Error al actualizar matrícula.')
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Editar Matrícula</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <EnrollmentFormFields form={form} setForm={setForm} studentDisabled={true} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export default function ModulosMatriculas() {
  const [enrollments, setEnrollments] = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]         = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]         = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [search, setSearch]           = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterPrograma, setFilterPrograma] = useState('')
  const [filterRol, setFilterRol]     = useState('')
  const [filterEstado, setFilterEstado]     = useState('')
  const [sortKey, setSortKey]         = useState('nombre_estudiante')
  const [sortDir, setSortDir]         = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [selected, setSelected]       = useState({})
  const [page, setPage]               = useState(1)
  const [showCreate, setShowCreate]   = useState(false)
  const [editEnrollment, setEditEnrollment] = useState(null)
  const [syncResults, setSyncResults] = useState({}) // { [enrollmentId]: { status, message } }
  const [retryingId, setRetryingId]   = useState(null)
  const [perPage, setPerPage] = useState(10)
  // Sin setLoading(true) al principio a propósito: esto se llama también
  // después de crear/editar/eliminar/sincronizar una fila, y forzar el
  // spinner de página completa cada vez volaba la tabla a blanco por una
  // sola fila cambiada. La tabla se queda visible (con el dato de antes)
  // hasta que llega el dato fresco.
  const loadEnrollments = useCallback(async () => {
    try {
      const data = await fetchEnrollmentsList()
      setCached(CACHE_KEY, data)
      setEnrollments(data)
    } catch (e) {
      console.error('Error cargando matrículas:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  const filtered = useMemo(() => {
    // Las desmatriculadas (borrado lógico: estado='Desmatriculado') no se muestran aquí
    // — siguen existiendo para historial y re-sincronización en Sync Novedades.
    let data = enrollments.filter(e => (e.estado || '').trim().toLowerCase() !== 'desmatriculado')
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e => Object.values(e).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterPeriodo)  data = data.filter(e => e.periodo === filterPeriodo)
    if (filterPrograma) data = data.filter(e => e.programa === filterPrograma)
    if (filterRol)      data = data.filter(e => e.role === filterRol)
    if (filterEstado === 'sincronizado')      data = data.filter(e => e.sincronizado && !syncResults[e.id])
    else if (filterEstado === 'solo_bd')      data = data.filter(e => !e.sincronizado && !syncResults[e.id])
    else if (filterEstado === 'pendiente')    data = data.filter(e => syncResults[e.id]?.status === 'pendiente')
    else if (filterEstado === 'usuario_no_existe') data = data.filter(e => syncResults[e.id]?.status === 'usuario_no_existe')
    else if (filterEstado === 'error')        data = data.filter(e => syncResults[e.id]?.status === 'error')
    else if (filterEstado === 'traslado')     data = data.filter(e => e.estado_sync === 'traslado')
    else if (filterEstado === 'desmatriculando') data = data.filter(e => syncResults[e.id]?.status === 'desmatriculando' || e.estado_sync === 'desmatriculando')
    data.sort((a, b) => {
      const av = String(a[sortKey] || '')
      const bv = String(b[sortKey] || '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return data
  }, [enrollments, search, filterPeriodo, filterPrograma, filterRol, filterEstado, syncResults, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)
  const periodos   = [...new Set(enrollments.map(e => e.periodo).filter(Boolean))]
  const programas  = [...new Set(enrollments.map(e => e.programa).filter(Boolean))]
  const roles      = [...new Set(enrollments.map(e => e.role).filter(Boolean))]

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

  const selectedEnrollments = enrollments.filter(e => selected[e.id])

  const applySyncResults = (results) => {
    setSyncResults(prev => {
      const next = { ...prev }
      results.forEach(r => {
        if (r.status === 'success') delete next[r.id]
        else next[r.id] = { status: r.status, message: r.message || r.error }
      })
      return next
    })
  }

  const handleSync = async () => {
    if (selectedEnrollments.length === 0) return
    setSyncing(true)
    const syncingIds = new Set(selectedEnrollments.map(e => e.id))
    setEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: true } : e))
    try {
      const res = await syncEnrollments(selectedEnrollments)
      const results = res?.body?.results || []
      const failed = results.filter(r => r.status === 'error')
      applySyncResults(results)
      await loadEnrollments()
      setSelected({})
      if (failed.length > 0) {
        alert(`${failed.length} matrícula(s) no se pudieron sincronizar:\n` +
          failed.map(f => `- ID ${f.id}: ${f.error}`).join('\n'))
      }
    } catch (e) {
      console.error('Error sincronizando:', e.message)
      alert('Error al sincronizar matrículas: ' + e.message)
      setEnrollments(prev => prev.map(e => syncingIds.has(e.id) ? { ...e, _syncing: false } : e))
    }
    setSyncing(false)
  }

  const handleRetry = async (enrollment) => {
    setRetryingId(enrollment.id)
    setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, _syncing: true } : e))
    try {
      const res = await syncEnrollments([enrollment])
      const results = res?.body?.results || []
      applySyncResults(results)
      await loadEnrollments()
      const failed = results.find(r => r.status === 'error')
      if (failed) alert(`No se pudo sincronizar: ${failed.error}`)
    } catch (e) {
      console.error('Error reintentando:', e.message)
      alert('Error al reintentar: ' + e.message)
      setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, _syncing: false } : e))
    }
    setRetryingId(null)
  }

  const handleDelete = async (enrollment) => {
    if (!confirm(`¿Desmatricular a ${enrollment.nombre_estudiante} de ${enrollment.nombre_asignatura}?\n\nNo se borra de la base de datos (se conserva el historial): se desmatriculará de Moodle (vía BD externa) y quedará registrado en Sync > Novedades.`)) return
    try {
      await deleteEnrollment(enrollment.id)
      await loadEnrollments()
    } catch (e) {
      console.error('Error desmatriculando:', e.message)
    }
  }

  // Solo tiene sentido con más de una seleccionada: para una sola ya está el
  // ícono de desmatricular individual en la fila.
  const handleBulkDelete = async () => {
    if (selectedEnrollments.length <= 1) return
    if (!confirm(`¿Desmatricular ${selectedEnrollments.length} matrículas?\n\nNo se borran de la base de datos (se conserva el historial): se desmatricularán de Moodle (vía BD externa) y quedarán registradas en Sync > Novedades.`)) return
    setDeleting(true)
    const results = await Promise.allSettled(selectedEnrollments.map(e => deleteEnrollment(e.id)))
    const failed = results.filter(r => r.status === 'rejected')
    await loadEnrollments()
    setSelected({})
    setDeleting(false)
    if (failed.length > 0) {
      alert(`${failed.length} de ${selectedEnrollments.length} matrículas no se pudieron desmatricular:\n` +
        failed.map(f => `- ${f.reason?.message || 'Error desconocido'}`).join('\n'))
    }
  }

  const allPageSelected = paginated.length > 0 && paginated.every(e => selected[e.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Módulo Matrículas</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleSync} disabled={selectedEnrollments.length === 0 || syncing}>
            <RefreshCw size={15} />
            {syncing ? 'Sincronizando...' : `Sincronizar (${selectedEnrollments.length})`}
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={15} /> Crear Matrícula
          </button>
          <button
            className="btn-icon btn-icon-delete"
            onClick={handleBulkDelete}
            disabled={selectedEnrollments.length <= 1 || deleting}
            title={selectedEnrollments.length <= 1 ? 'Selecciona más de una matrícula para desmatricular en masa (para una sola usa el ícono de la fila)' : `Desmatricular ${selectedEnrollments.length} matrículas`}
            style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}
          >
            <Trash2 size={15} />
            {deleting ? 'Desmatriculando...' : `Desmatricular (${selectedEnrollments.length})`}
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por estudiante, documento, código de asignatura..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterPeriodo} onChange={e => { setFilterPeriodo(e.target.value); setPage(1) }}>
          <option value="">Todos los periodos</option>
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterPrograma} onChange={e => { setFilterPrograma(e.target.value); setPage(1) }}>
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={filterRol} onChange={e => { setFilterRol(e.target.value); setPage(1) }}>
          <option value="">Todos los roles</option>
          {roles.map(r => <option key={r} value={r}>{ROLE_OPTIONS.find(o => o.value === r)?.label || r}</option>)}
        </select>
        <select className="filter-select" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="solo_bd">Solo en BD</option>
          <option value="pendiente">Pendiente</option>
          <option value="usuario_no_existe">Usuario no existe en Moodle</option>
          <option value="error">Error</option>
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
                  <th><input type="checkbox" checked={allPageSelected} onChange={selectAll} /></th>
                  <th onClick={() => handleSort('nombre_estudiante')} className="sortable">
                    Estudiante / Usuario
                    {sortKey === 'nombre_estudiante'
                      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                  </th>
                  <th>Asignatura</th>
                  <th onClick={() => handleSort('codigo_journey')} className="sortable">
                    Código Curso
                    {sortKey === 'codigo_journey'
                      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                  </th>
                  <th onClick={() => handleSort('programa')} className="sortable">
                    Programa
                    {sortKey === 'programa'
                      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                  </th>
                  <th>Periodo / Grupo</th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    Fecha Matrícula
                    {sortKey === 'created_at'
                      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                  </th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(enrollment => (
                  <Fragment key={enrollment.id}>
                    <tr className={selected[enrollment.id] ? 'row-selected' : ''}>
                      <td data-label="Seleccionar"><input type="checkbox" checked={!!selected[enrollment.id]} onChange={() => toggleSelect(enrollment.id)} /></td>
                      <td data-label="Estudiante / Usuario">{enrollment.nombre_estudiante || enrollment.documento || '-'}</td>
                      <td data-label="Asignatura">
                        {enrollment.nombre_asignatura || '-'}
                        <span className="asignatura-code">{enrollment.codigo_asignatura || '-'}</span>
                      </td>
                      <td data-label="Código Curso"><span className="codigo-journey">{enrollment.codigo_journey || '-'}</span></td>
                      <td data-label="Programa">{enrollment.programa || '-'}</td>
                      <td data-label="Periodo / Grupo">{enrollment.periodo || '-'} / Grupo {enrollment.grupo || '-'}</td>
                      <td data-label="Fecha Matrícula">{enrollment.created_at ? String(enrollment.created_at).split('T')[0] : '-'}</td>
                      <td data-label="Estado"><StatusBadge row={enrollment} syncResult={syncResults[enrollment.id]} /></td>
                      <td data-label="Acciones">
                        <div className="action-btns">
                          {['pendiente', 'usuario_no_existe', 'error', 'desmatriculando'].includes(syncResults[enrollment.id]?.status) && (
                            <button
                              className="btn-icon"
                              onClick={() => handleRetry(enrollment)}
                              disabled={retryingId === enrollment.id}
                              title={syncResults[enrollment.id]?.message || 'Reintentar sincronización'}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button className="btn-icon" onClick={() => toggleExpand(enrollment.id)} title="Desplegar opciones">
                            {expandedRows[enrollment.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button className="btn-icon" onClick={() => toggleExpand(enrollment.id)} title="Ver detalles">
                            <BookOpen size={14} />
                          </button>
                          <button className="btn-icon btn-icon-edit" onClick={() => setEditEnrollment(enrollment)} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(enrollment)} title="Desmatricular">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[enrollment.id] && (
                      <tr className="expand-row">
                        <td colSpan={9}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Rol</span>
                                <span className="expand-value">
                                  {ROLE_OPTIONS.find(r => r.value === enrollment.role)?.label || enrollment.role || '-'}
                                  {' '}<span className="badge badge-moodle moodle-hint">{ROLE_MOODLE_HINT[enrollment.role] || ''}</span>
                                </span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Estado Académico</span>
                                <span className="expand-value">
                                  {enrollment.estado || '-'}
                                  {' '}<span className="badge badge-moodle moodle-hint">{ESTADO_MOODLE_HINT[enrollment.estado] || ''}</span>
                                </span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Código Nexo</span>
                                <span className="expand-value">{enrollment.codigo_journey || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Documento</span>
                                <span className="expand-value">{enrollment.documento || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Email</span>
                                <span className="expand-value">{enrollment.email || '-'}</span>
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

          <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
        </>
      )}

      {showCreate && (
        <CreateEnrollmentModal onClose={() => setShowCreate(false)} onSave={loadEnrollments} />
      )}
      {editEnrollment && (
        <EditEnrollmentModal enrollment={editEnrollment} onClose={() => setEditEnrollment(null)} onSave={loadEnrollments} />
      )}
    </div>
  )
}
