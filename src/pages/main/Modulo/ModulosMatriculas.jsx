import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, RefreshCw, Search, UserPlus, BookOpen } from 'lucide-react'
import { fetchEnrollmentsList } from '../../../services/matriculas/fetchEnrollmentsList'
import { syncEnrollments } from '../../../services/matriculas/syncEnrollments'
import { createEnrollment } from '../../../services/matriculas/createEnrollment'
import { updateEnrollment } from '../../../services/matriculas/updateEnrollment'
import { deleteEnrollment } from '../../../services/matriculas/deleteEnrollment'
import { searchUsers } from '../../../services/usuarios/searchUsers'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Modulo/ModulosMatriculas.css"

const ROLE_OPTIONS = [
  { value: 'gestor',         label: 'Gestor' },
  { value: 'editingteacher', label: 'Editing Teacher' },
  { value: 'teacher',        label: 'Teacher' },
  { value: 'student',        label: 'Student' },
  { value: 'revisor',        label: 'Revisor' },
]

const ESTADO_ACADEMICO_OPTIONS = ['Matriculado', 'Suspendido', 'Finalizada', 'Cancelada', 'Pendiente']

const EMPTY_FORM = {
  userid: '', studentLabel: '', role: 'student',
  codigo_asignatura: '', nombre_asignatura: '', grupo: '', periodo: '', programa: '',
  estado: 'Matriculado', courseid: '', codigo_journey: ''
}

function StatusBadge({ row }) {
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
          <label>Estado Académico</label>
          <select name="estado" value={form.estado} onChange={handleChange}>
            {ESTADO_ACADEMICO_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div className="modal-section-title">Detalles de Integración (opcional)</div>
      <div className="modal-row">
        <div className="modal-field">
          <label>ID Curso Moodle</label>
          <input name="courseid" value={form.courseid} onChange={handleChange} placeholder="Se asigna al sincronizar" />
        </div>
        <div className="modal-field">
          <label>Código Journey</label>
          <input name="codigo_journey" value={form.codigo_journey} onChange={handleChange} placeholder="Se genera automáticamente si se deja vacío" />
        </div>
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
        courseid: form.courseid ? Number(form.courseid) : null,
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
    courseid: enrollment.courseid || '',
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
        courseid: form.courseid ? Number(form.courseid) : null
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
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [search, setSearch]           = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterPrograma, setFilterPrograma] = useState('')
  const [filterEstado, setFilterEstado]     = useState('')
  const [sortKey, setSortKey]         = useState('nombre_estudiante')
  const [sortDir, setSortDir]         = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [selected, setSelected]       = useState({})
  const [page, setPage]               = useState(1)
  const [showCreate, setShowCreate]   = useState(false)
  const [editEnrollment, setEditEnrollment] = useState(null)
  const PER_PAGE = 15

  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEnrollmentsList()
      setEnrollments(data)
    } catch (e) {
      console.error('Error cargando matrículas:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEnrollments() }, [loadEnrollments])

  const filtered = useMemo(() => {
    let data = [...enrollments]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e => [e.nombre_estudiante, e.documento, e.codigo_asignatura, e.nombre_asignatura]
        .some(v => v && String(v).toLowerCase().includes(q)))
    }
    if (filterPeriodo)  data = data.filter(e => e.periodo === filterPeriodo)
    if (filterPrograma) data = data.filter(e => e.programa === filterPrograma)
    if (filterEstado === 'sincronizado') data = data.filter(e => e.sincronizado)
    else if (filterEstado === 'solo_bd') data = data.filter(e => !e.sincronizado)
    data.sort((a, b) => {
      const av = String(a[sortKey] || '')
      const bv = String(b[sortKey] || '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return data
  }, [enrollments, search, filterPeriodo, filterPrograma, filterEstado, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const periodos   = [...new Set(enrollments.map(e => e.periodo).filter(Boolean))]
  const programas  = [...new Set(enrollments.map(e => e.programa).filter(Boolean))]

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

  const handleSync = async () => {
    if (selectedEnrollments.length === 0) return
    setSyncing(true)
    try {
      const res = await syncEnrollments(selectedEnrollments)
      const results = res?.body?.results || []
      const failed = results.filter(r => r.status === 'error')
      await loadEnrollments()
      setSelected({})
      if (failed.length > 0) {
        alert(`${failed.length} matrícula(s) no se pudieron sincronizar:\n` +
          failed.map(f => `- ID ${f.id}: ${f.error}`).join('\n'))
      }
    } catch (e) {
      console.error('Error sincronizando:', e.message)
      alert('Error al sincronizar matrículas: ' + e.message)
    }
    setSyncing(false)
  }

  const handleDelete = async (enrollment) => {
    if (!confirm(`¿Eliminar la matrícula de ${enrollment.nombre_estudiante} en ${enrollment.nombre_asignatura}?`)) return
    try {
      await deleteEnrollment(enrollment.id)
      await loadEnrollments()
    } catch (e) {
      console.error('Error eliminando:', e.message)
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
        <select className="filter-select" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="solo_bd">Solo en BD</option>
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
                  <th><input type="checkbox" checked={allPageSelected} onChange={selectAll} /></th>
                  <th onClick={() => handleSort('nombre_estudiante')} className="sortable">
                    Estudiante / Usuario
                    {sortKey === 'nombre_estudiante'
                      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                  </th>
                  <th>Asignatura</th>
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
                      <td><input type="checkbox" checked={!!selected[enrollment.id]} onChange={() => toggleSelect(enrollment.id)} /></td>
                      <td>{enrollment.nombre_estudiante || enrollment.documento || '-'}</td>
                      <td>
                        {enrollment.nombre_asignatura || '-'}
                        <span className="asignatura-code">{enrollment.codigo_asignatura || '-'}</span>
                      </td>
                      <td>{enrollment.programa || '-'}</td>
                      <td>{enrollment.periodo || '-'} / Grupo {enrollment.grupo || '-'}</td>
                      <td>{enrollment.created_at ? String(enrollment.created_at).split('T')[0] : '-'}</td>
                      <td><StatusBadge row={enrollment} /></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(enrollment.id)} title="Desplegar opciones">
                            {expandedRows[enrollment.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button className="btn-icon" onClick={() => toggleExpand(enrollment.id)} title="Ver detalles">
                            <BookOpen size={14} />
                          </button>
                          <button className="btn-icon btn-icon-edit" onClick={() => setEditEnrollment(enrollment)} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(enrollment)} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[enrollment.id] && (
                      <tr className="expand-row">
                        <td colSpan={8}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Rol</span>
                                <span className="expand-value">{enrollment.role || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Estado Académico</span>
                                <span className="expand-value">{enrollment.estado || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Código Journey</span>
                                <span className="expand-value">{enrollment.codigo_journey || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">ID Curso Moodle</span>
                                <span className="expand-value">{enrollment.courseid || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">ID Matrícula Moodle</span>
                                <span className="expand-value">{enrollment.moodle_enrollment_id || '-'}</span>
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

      {showCreate && (
        <CreateEnrollmentModal onClose={() => setShowCreate(false)} onSave={loadEnrollments} />
      )}
      {editEnrollment && (
        <EditEnrollmentModal enrollment={editEnrollment} onClose={() => setEditEnrollment(null)} onSave={loadEnrollments} />
      )}
    </div>
  )
}
