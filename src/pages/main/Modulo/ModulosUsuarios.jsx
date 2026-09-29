import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import Paginacion from '../../../components/Paginacion'
import { ChevronDown, ChevronUp, Pencil, Trash2, RefreshCw, Search, UserPlus, KeyRound, Eye, ExternalLink } from 'lucide-react'
import { fetchUsers } from '../../../services/usuarios/fetchUsers'
import { syncUsers } from '../../../services/usuarios/syncUsers'
import { deleteUser } from '../../../services/usuarios/deleteUser'
import { updateUser } from '../../../services/usuarios/updateUser'
import { createUser } from '../../../services/usuarios/createUser'
import { resetPassword } from '../../../services/usuarios/resetPassword'
import { getUserEnrollments } from '../../../services/usuarios/getUserEnrollments'
import { getCached, setCached } from '../../../services/swrCache'
import "../../../styles/main/Sync/SyncUsuariosP.css"

// Misma key que Sync Usuarios: consultan exactamente el mismo preview.
const CACHE_KEY = 'users-preview'

const COLUMNS = [
  { key: 'nombre',     label: 'Nombre' },
  { key: 'email',      label: 'Email' },
  { key: 'documento',  label: 'Documento' },
  { key: 'created_at', label: 'Fecha Creación' },
]

const EMPTY_FORM = {
  firstname: '', lastname: '', email: '', documento: '',
  correo_personal: '', telefono: '', celular: '',
  fecha_nacimiento: '', jornada: '', city: 'Medellín',
  country: 'CO', departamento_academico: '', plan_estudios: ''
}

function StatusBadge({ row }) {
  if (row._syncing)               return <span className="badge badge-syncing">Sincronizando...</span>
  if (row._status === 'error')   return <span className="badge badge-error">Error</span>
  if (row._status === 'success') return <span className="badge badge-success">Creado</span>
  if (row._synced || (row._syncStatus?.inDB && row._syncStatus?.inMoodle)) return <span className="badge badge-synced">Sincronizado</span>
  if (row._syncStatus?.inDB)     return <span className="badge badge-db">Solo en BD</span>
  if (row._syncStatus?.inMoodle) return <span className="badge badge-moodle">Solo en Moodle</span>
  return <span className="badge badge-pending">Pendiente</span>
}

function CreateUserModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.firstname || !form.lastname || !form.email || !form.documento) {
      setError('Nombre, apellido, email y documento son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createUser({ ...form, username: form.email })
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
          <h3>Crear Usuario</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-section-title">Datos Básicos *</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Nombre *</label>
              <input name="firstname" value={form.firstname} onChange={handleChange} placeholder="Nombre" />
            </div>
            <div className="modal-field">
              <label>Apellido *</label>
              <input name="lastname" value={form.lastname} onChange={handleChange} placeholder="Apellido" />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Correo Institucional *</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="correo@pascualbravo.edu.co" />
            </div>
            <div className="modal-field">
              <label>Documento *</label>
              <input name="documento" value={form.documento} onChange={handleChange} placeholder="Número de documento" />
            </div>
          </div>
          <div className="modal-section-title">Contacto</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Correo Personal</label>
              <input name="correo_personal" value={form.correo_personal} onChange={handleChange} placeholder="correo@gmail.com" />
            </div>
            <div className="modal-field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Celular</label>
              <input name="celular" value={form.celular} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-section-title">Información Académica</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Jornada</label>
              <input name="jornada" value={form.jornada} onChange={handleChange} placeholder="VIRTUAL / DIURNA / NOCTURNA" />
            </div>
            <div className="modal-field">
              <label>Ciudad</label>
              <input name="city" value={form.city} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-field">
            <label>Departamento Académico</label>
            <input name="departamento_academico" value={form.departamento_academico} onChange={handleChange} />
          </div>
          <div className="modal-field">
            <label>Plan de Estudios</label>
            <input name="plan_estudios" value={form.plan_estudios} onChange={handleChange} />
          </div>
          <p className="modal-hint">La contraseña inicial será el número de documento.</p>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ ...user })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.firstname || !form.lastname || !form.email || !form.documento) {
      setError('Nombre, apellido, email y documento son obligatorios.')
      return
    }
    try {
      const cleaned = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      )
      await updateUser(user.id, cleaned)
      onSave()
      onClose()
    } catch (e) {
      console.error('Error actualizando:', e.message)
      setError('Error al actualizar usuario.')
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Editar Usuario</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-section-title">Datos Básicos *</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Nombre *</label>
              <input name="firstname" value={form.firstname || ''} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Apellido *</label>
              <input name="lastname" value={form.lastname || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Correo Institucional</label>
              <input name="email" value={form.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="modal-field">
              <label>Documento</label>
              <input name="documento" value={form.documento || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="modal-section-title">Contacto</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Correo Personal</label>
              <input name="correo_personal" value={form.correo_personal || ''} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Celular</label>
              <input name="celular" value={form.celular || ''} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento ? String(form.fecha_nacimiento).split('T')[0] : ''} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-section-title">Información Académica</div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Jornada</label>
              <input name="jornada" value={form.jornada || ''} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Ciudad</label>
              <input name="city" value={form.city || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-field">
            <label>Departamento Académico</label>
            <input name="departamento_academico" value={form.departamento_academico || ''} onChange={handleChange} />
          </div>
          <div className="modal-field">
            <label>Plan de Estudios</label>
            <input name="plan_estudios" value={form.plan_estudios || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

const ROLE_LABEL = {
  student:        'Estudiante',
  editingteacher: 'Profesor',
  teacher:        'Tutor',
}

// Estado académico (ya normalizado en la BD, ver services/normalize.js del API).
const ESTADO_BADGE = {
  Matriculado:    'badge-success',
  Trasladado:     'badge-novedad',
  Pendiente:      'badge-pending',
  Suspendido:     'badge-suspended',
  Cancelado:      'badge-error',
  Desmatriculado: 'badge-error',
  Retirado:       'badge-error',
  Finalizado:     'badge-db',
}

// Estado frente a Moodle (columna estado_sync de enrollments).
const SYNC_BADGE = {
  sincronizado:    { cls: 'badge-synced',  label: 'Sincronizado' },
  error:           { cls: 'badge-error',   label: 'Error' },
  traslado:        { cls: 'badge-novedad', label: 'Traslado' },
  desmatriculando: { cls: 'badge-syncing', label: 'Desmatriculando' },
}

function formatFecha(value) {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatPeriodo(periodo) {
  if (!periodo) return '-'
  const p = String(periodo)
  return p.length === 5 ? `${p.slice(0, 4)}-${p.slice(4)}` : p
}

function UserDetailModal({ user, onClose }) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getUserEnrollments(user.id)
      .then(setEnrollments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user.id])

  const activas = enrollments.filter(e => e.estado === 'Matriculado').length

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '1150px', width: '95vw' }}>
        <div className="modal-header">
          <h3>Detalle de {user.nombre}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="expand-grid user-detail-grid">
            <div className="expand-item">
              <span className="expand-label">Documento</span>
              <span className="expand-value">{user.documento || '-'}</span>
            </div>
            <div className="expand-item">
              <span className="expand-label">Email</span>
              <span className="expand-value">{user.email || '-'}</span>
            </div>
            <div className="expand-item">
              <span className="expand-label">Programa</span>
              <span className="expand-value">{user.plan_estudios || '-'}</span>
            </div>
            <div className="expand-item">
              <span className="expand-label">Jornada</span>
              <span className="expand-value">{user.jornada || '-'}</span>
            </div>
          </div>

          <h4 className="user-detail-subtitle">
            Matrículas
            {!loading && !error && <span> · {enrollments.length} en total, {activas} activa{activas === 1 ? '' : 's'}</span>}
          </h4>

          {loading ? (
            <div className="loading-box" style={{ padding: '1rem' }}><span className="loader"></span>Cargando matrículas...</div>
          ) : error ? (
            <p className="user-detail-empty">{error}</p>
          ) : enrollments.length === 0 ? (
            <p className="user-detail-empty">Este usuario no tiene matrículas registradas.</p>
          ) : (
            <div className="user-detail-table-wrap">
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Período</th>
                    <th>Asignatura</th>
                    <th>Código Curso</th>
                    <th>Grupo</th>
                    <th>Rol</th>
                    <th>Estado académico</th>
                    <th>Moodle</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => {
                    const sync = SYNC_BADGE[e.estado_sync] || { cls: 'badge-pending', label: 'Pendiente' }
                    return (
                      <tr key={e.id}>
                        <td data-label="Fecha">{formatFecha(e.fecha_matricula)}</td>
                        <td data-label="Período">{formatPeriodo(e.periodo)}</td>
                        <td data-label="Asignatura">
                          {e.nombre_asignatura || e.fullname || '-'}
                          <span className="asignatura-code">{e.codigo_asignatura || '-'}</span>
                        </td>
                        <td data-label="Código Curso"><span className="codigo-journey">{e.codigo_journey || e.idnumber || '-'}</span></td>
                        <td data-label="Grupo">{e.grupo || '-'}</td>
                        <td data-label="Rol">{ROLE_LABEL[e.role] || e.role || '-'}</td>
                        <td data-label="Estado académico">
                          <span className={`badge ${ESTADO_BADGE[e.estado] || 'badge-pending'}`}>{e.estado || '-'}</span>
                          {e.fecha_cambio_estado && (
                            <div className="user-detail-hint" title={e.estado_anterior ? `Antes: ${e.estado_anterior}` : undefined}>
                              desde {formatFecha(e.fecha_cambio_estado)}
                            </div>
                          )}
                        </td>
                        <td data-label="Moodle">
                          <span className={`badge ${sync.cls}`} title={e.ultimo_error_sync || undefined}>{sync.label}</span>
                          {e.moodle_course_url && (
                            <div>
                              <a href={e.moodle_course_url} target="_blank" rel="noopener noreferrer" className="expand-link">
                                Ver curso <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default function ModulosUsuarios() {
  const [users, setUsers]               = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]           = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]           = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [search, setSearch]             = useState('')
  const [filterJornada, setFilterJornada]   = useState('')
  const [filterEstado, setFilterEstado]     = useState('')
  const [sortKey, setSortKey]           = useState('nombre')
  const [sortDir, setSortDir]           = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [selected, setSelected]         = useState({})
  const [page, setPage]                 = useState(1)
  const [showCreate, setShowCreate]     = useState(false)
  const [editUser, setEditUser]         = useState(null)
  const [detailUser, setDetailUser]     = useState(null)
  const [perPage, setPerPage] = useState(10)
  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers()
      setCached(CACHE_KEY, data)
      setUsers(data)
    } catch (e) {
      console.error('Error cargando usuarios:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = useMemo(() => {
    let data = [...users]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(u => Object.values(u).some(v =>
        (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(q)
      ))
    }
    if (filterJornada) data = data.filter(u => u.jornada === filterJornada)
    if (filterEstado === 'sincronizado')   data = data.filter(u => u._synced || (u._syncStatus?.inDB && u._syncStatus?.inMoodle))
    else if (filterEstado === 'solo_bd')   data = data.filter(u => !u._synced && u._syncStatus?.inDB && !u._syncStatus?.inMoodle)
    else if (filterEstado === 'pendiente') data = data.filter(u => !u._syncStatus?.inDB)
    data.sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return data
  }, [users, search, filterJornada, filterEstado, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)
  const jornadas   = [...new Set(users.map(u => u.jornada).filter(Boolean))]

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const toggleExpand = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const selectAll = () => {
    const allSelected = paginated.every(u => selected[u.id])
    const next = { ...selected }
    paginated.forEach(u => { next[u.id] = !allSelected })
    setSelected(next)
  }

  const selectedUsers = users.filter(u => selected[u.id])

  const handleSync = async () => {
    if (selectedUsers.length === 0) return
    setSyncing(true)
    const syncingIds = new Set(selectedUsers.map(u => u.id))
    setUsers(prev => prev.map(u => syncingIds.has(u.id) ? { ...u, _syncing: true } : u))
    try {
      await syncUsers(selectedUsers)
      setUsers(prev => prev.map(u =>
        syncingIds.has(u.id)
          ? { ...u, _syncing: false, _syncStatus: { inDB: true, inMoodle: false }, _synced: true }
          : u
      ))
      setSelected({})
    } catch (e) {
      console.error('Error sincronizando:', e.message)
      setUsers(prev => prev.map(u =>
        syncingIds.has(u.id) ? { ...u, _syncing: false, _status: 'error' } : u
      ))
    }
    setSyncing(false)
  }

  const handleDelete = async (user) => {
    if (!confirm(`¿Eliminar a ${user.nombre} de Nexo?`)) return
    try {
      await deleteUser(user.id)
      await loadUsers()
    } catch (e) {
      console.error('Error eliminando:', e.message)
    }
  }

  // Solo tiene sentido con más de un seleccionado: para uno solo ya está el
  // ícono de eliminar individual en la fila.
  const handleBulkDelete = async () => {
    if (selectedUsers.length <= 1) return
    if (!confirm(`¿Eliminar ${selectedUsers.length} usuarios de Nexo? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    const results = await Promise.allSettled(selectedUsers.map(u => deleteUser(u.id)))
    const failed = results.filter(r => r.status === 'rejected')
    await loadUsers()
    setSelected({})
    setDeleting(false)
    if (failed.length > 0) {
      alert(`${failed.length} de ${selectedUsers.length} usuarios no se pudieron eliminar:\n` +
        failed.map(f => `- ${f.reason?.message || 'Error desconocido'}`).join('\n'))
    }
  }

  const handleResetPassword = async (user) => {
    if (!confirm(`¿Resetear la contraseña de ${user.nombre} a su documento?`)) return
    try {
      await resetPassword(user.id)
      alert('Contraseña restablecida correctamente')
    } catch (e) {
      console.error('Error reseteando contraseña:', e.message)
    }
  }

  const allPageSelected = paginated.length > 0 && paginated.every(u => selected[u.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Módulo Usuarios</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowCreate(true)}>
            <UserPlus size={15} /> Crear Usuario
          </button>
          <button className="btn-primary" onClick={handleSync} disabled={selectedUsers.length === 0 || syncing}>
            <RefreshCw size={15} />
            {syncing ? 'Sincronizando...' : `Sincronizar (${selectedUsers.length})`}
          </button>
          <button
            className="btn-icon btn-icon-delete"
            onClick={handleBulkDelete}
            disabled={selectedUsers.length <= 1 || deleting}
            title={selectedUsers.length <= 1 ? 'Selecciona más de un usuario para eliminar en masa (para uno solo usa el ícono de la fila)' : `Eliminar ${selectedUsers.length} usuarios`}
            style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8 }}
          >
            <Trash2 size={15} />
            {deleting ? 'Eliminando...' : `Eliminar (${selectedUsers.length})`}
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por nombre, email, documento..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterJornada} onChange={e => { setFilterJornada(e.target.value); setPage(1) }}>
          <option value="">Todas las jornadas</option>
          {jornadas.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <select className="filter-select" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="sincronizado">Sincronizado</option>
          <option value="solo_bd">Solo en BD</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando usuarios...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allPageSelected} onChange={selectAll} /></th>
                  {COLUMNS.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="sortable">
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                    </th>
                  ))}
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(user => (
                  <Fragment key={user.id}>
                    <tr className={selected[user.id] ? 'row-selected' : ''}>
                      <td data-label="Seleccionar"><input type="checkbox" checked={!!selected[user.id]} onChange={() => toggleSelect(user.id)} /></td>
                      {COLUMNS.map(col => (
                        <td data-label={col.label} key={col.key}>
                          {col.key === 'created_at'
                            ? user[col.key] ? String(user[col.key]).split('T')[0] : '-'
                            : user[col.key] || '-'}
                        </td>
                      ))}
                      <td data-label="Estado"><StatusBadge row={user} /></td>
                      <td data-label="Acciones">
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(user.id)} title="Ver más">
                            {expandedRows[user.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button className="btn-icon" onClick={() => setDetailUser(user)} title="Ver detalle y matrículas">
                            <Eye size={14} />
                          </button>
                          <button className="btn-icon btn-icon-edit" onClick={() => setEditUser(user)} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => handleResetPassword(user)} title="Resetear contraseña">
                            <KeyRound size={14} />
                          </button>
                          <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(user)} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[user.id] && (
                      <tr className="expand-row">
                        <td colSpan={COLUMNS.length + 3}>
                          <div className="expand-content">
                            <div className="expand-grid">
                              <div className="expand-item">
                                <span className="expand-label">Jornada</span>
                                <span className="expand-value">{user.jornada || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Departamento</span>
                                <span className="expand-value">{user.departamento_academico || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Correo Personal</span>
                                <span className="expand-value">{user.correo_personal || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Teléfono</span>
                                <span className="expand-value">{user.telefono || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Celular</span>
                                <span className="expand-value">{user.celular || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Fecha Nacimiento</span>
                                <span className="expand-value">{user.fecha_nacimiento ? String(user.fecha_nacimiento).split('T')[0] : '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Ciudad</span>
                                <span className="expand-value">{user.city || '-'}</span>
                              </div>
                              <div className="expand-item">
                                <span className="expand-label">Username</span>
                                <span className="expand-value">{user.username || '-'}</span>
                              </div>
                              <div className="expand-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="expand-label">Plan de Estudios</span>
                                <span className="expand-value">{user.plan_estudios || '-'}</span>
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
        <CreateUserModal onClose={() => setShowCreate(false)} onSave={loadUsers} />
      )}
      {editUser && (
        <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={loadUsers} />
      )}
      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  )
}