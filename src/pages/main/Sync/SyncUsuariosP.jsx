import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import Paginacion from '../../../components/Paginacion'
import { ChevronDown, ChevronUp, Pencil, Trash2, RefreshCw, Search } from 'lucide-react'
import { fetchUsers } from '../../../services/usuarios/fetchUsers'
import { syncUsers } from '../../../services/usuarios/syncUsers'
import { deleteUser } from '../../../services/usuarios/deleteUser'
import { updateUser } from '../../../services/usuarios/updateUser'
import { aplicarCorreoPendiente } from '../../../services/usuarios/aplicarCorreoPendiente'
import { duplicarPorCorreoPendiente } from '../../../services/usuarios/duplicarPorCorreoPendiente'
import { descartarCorreoPendiente } from '../../../services/usuarios/descartarCorreoPendiente'
import { getCached, setCached } from '../../../services/swrCache'
import { useLocation } from 'react-router-dom'
import { humanize } from './novedadNombres'
import { confirmAccion, confirmEliminar, alertError, toastExito } from '../../../services/alerts'
import "../../../styles/main/Sync/SyncUsuariosP.css"

// Misma key que Módulos Usuarios: consultan exactamente el mismo preview.
const CACHE_KEY = 'users-preview'

const COLUMNS = [
  { key: 'nombre',     label: 'Nombre' },
  { key: 'email',      label: 'Email' },
  { key: 'documento',  label: 'Documento' },
  { key: 'created_at', label: 'Fecha Creación' },
]

function StatusBadge({ row }) {
  if (row._syncing)               return <span className="badge badge-syncing">Sincronizando...</span>
  if (row._status === 'error')   return <span className="badge badge-error">Error</span>
  if (row._status === 'success') return <span className="badge badge-success">Creado</span>
  if (row._synced || (row._syncStatus?.inDB && row._syncStatus?.inMoodle)) return <span className="badge badge-synced">Sincronizado</span>
  if (row._syncStatus?.inDB)     return <span className="badge badge-db">Solo en BD</span>
  if (row._syncStatus?.inMoodle) return <span className="badge badge-moodle">Solo en Moodle</span>
  return <span className="badge badge-pending">Pendiente</span>
}

function NovedadBadges({ user }) {
  if (!user.correo_pendiente && !(user.novedad_datos?.length > 0)) return null
  return (
    <>
      {user.correo_pendiente && <span className="badge badge-cambio-correo">Cambio de correo</span>}
      {user.novedad_datos?.length > 0 && <span className="badge badge-novedad">Novedad</span>}
    </>
  )
}

function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ ...user })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.firstname || !form.lastname) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    try {
      const cleaned = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      )
      await updateUser(user.id, cleaned)
      onSave()
      onClose()
      toastExito('Usuario actualizado')
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
          <div className="modal-section-title">Datos Básicos</div>
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

export default function SyncUsuariosP() {
  const location = useLocation()

  const [users, setUsers]               = useState(() => getCached(CACHE_KEY) || [])
  const [loading, setLoading]           = useState(() => !getCached(CACHE_KEY))
  const [syncing, setSyncing]           = useState(false)
  const [search, setSearch]             = useState('')
  const [filterJornada, setFilterJornada] = useState('')
  const [filterEstado, setFilterEstado]   = useState('')
  const [sortKey, setSortKey]           = useState('nombre')
  const [sortDir, setSortDir]           = useState('asc')
  const [expandedRows, setExpandedRows] = useState({})
  const [editUser, setEditUser]         = useState(null)
  const [selected, setSelected]         = useState({})
  const [page, setPage]                 = useState(1)
  const [perPage, setPerPage] = useState(10)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const documento = params.get('documento')
    if (documento) setSearch(documento)
  }, [location.search])

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
    else if (filterEstado === 'pendiente') data = data.filter(u => !u._syncStatus?.inMoodle && !u._synced)
    else if (filterEstado === 'novedad')       data = data.filter(u => u.novedad_datos?.length > 0)
    else if (filterEstado === 'cambio_correo') data = data.filter(u => !!u.correo_pendiente)
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
    const ok = await confirmEliminar({
      text: `No podrás revertir la eliminación de ${user.nombre} de Nexo.`,
    })
    if (!ok) return
    try {
      await deleteUser(user.id)
      await loadUsers()
      toastExito('Usuario eliminado')
    } catch (e) {
      console.error('Error eliminando:', e.message)
      alertError(e.message)
    }
  }

  const handleAplicarCorreo = async (user) => {
    const ok = await confirmAccion({
      title: '¿Actualizar el correo?',
      text: `El correo de ${user.nombre} pasará a ser ${user.correo_pendiente}.`,
      confirmButtonText: 'Sí, actualizar',
    })
    if (!ok) return
    try {
      await aplicarCorreoPendiente(user.id)
      await loadUsers()
      toastExito('Correo actualizado')
    } catch (e) {
      console.error('Error actualizando correo:', e.message)
      alertError(e.message)
    }
  }

  const handleDuplicarCorreo = async (user) => {
    const ok = await confirmAccion({
      title: '¿Crear un usuario nuevo?',
      text: `Se creará un usuario nuevo para ${user.nombre} con el correo ${user.correo_pendiente}. El usuario actual quedará con su documento archivado como historial.`,
      confirmButtonText: 'Sí, crear',
    })
    if (!ok) return
    try {
      await duplicarPorCorreoPendiente(user.id)
      await loadUsers()
      toastExito('Usuario nuevo creado')
    } catch (e) {
      console.error('Error creando usuario por correo pendiente:', e.message)
      alertError(e.message)
    }
  }

  const handleDescartarCorreo = async (user) => {
    const ok = await confirmAccion({
      title: '¿Descartar la propuesta?',
      text: `Se descartará el correo nuevo propuesto para ${user.nombre}.`,
      confirmButtonText: 'Sí, descartar',
    })
    if (!ok) return
    try {
      await descartarCorreoPendiente(user.id)
      await loadUsers()
      toastExito('Novedad descartada')
    } catch (e) {
      console.error('Error descartando correo pendiente:', e.message)
      alertError(e.message)
    }
  }

  const allPageSelected = paginated.length > 0 && paginated.every(u => selected[u.id])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Usuarios Plataforma</h2>
        <button className="btn-primary" onClick={handleSync} disabled={selectedUsers.length === 0 || syncing}>
          <RefreshCw size={15} />
          {syncing ? 'Sincronizando...' : `Sincronizar (${selectedUsers.length})`}
        </button>
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
          <option value="novedad">Novedad</option>
          <option value="cambio_correo">Cambio de correo</option>
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
                      <td data-label="Estado"><StatusBadge row={user} /> <NovedadBadges user={user} /></td>
                      <td data-label="Acciones">
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => toggleExpand(user.id)} title="Ver más">
                            {expandedRows[user.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button className="btn-icon btn-icon-edit" onClick={() => setEditUser(user)} title="Editar">
                            <Pencil size={14} />
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

                            {user.correo_pendiente && (
                              <div className="novedad-section">
                                <div className="novedad-section-title">Cambio de correo reportado por SICAU</div>
                                <div className="novedad-correo-row">
                                  Actual: <strong>{user.email || '-'}</strong> → Propuesto: <strong>{user.correo_pendiente}</strong>
                                </div>
                                <div className="action-btns">
                                  <button className="btn-primary" onClick={() => handleAplicarCorreo(user)}>Actualizar correo</button>
                                  <button className="btn-secondary" onClick={() => handleDuplicarCorreo(user)}>Crear otro usuario</button>
                                  <button className="btn-secondary" onClick={() => handleDescartarCorreo(user)}>Descartar</button>
                                </div>
                              </div>
                            )}

                            {user.novedad_datos?.length > 0 && (
                              <div className="novedad-section">
                                <div className="novedad-section-title">Última novedad aplicada automáticamente</div>
                                <ul className="novedad-datos-list">
                                  {user.novedad_datos.map((c, i) => (
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

      {editUser && (
        <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={loadUsers} />
      )}
    </div>
  )
}