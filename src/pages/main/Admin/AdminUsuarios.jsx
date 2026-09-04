import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pencil, Search, UserPlus, Power } from 'lucide-react'
import { fetchPlatformUsers } from '../../../services/admin/fetchPlatformUsers'
import { createPlatformUser } from '../../../services/admin/createPlatformUser'
import { updatePlatformUser } from '../../../services/admin/updatePlatformUser'
import { togglePlatformUserEstado } from '../../../services/admin/togglePlatformUserEstado'
import { fetchRoles } from '../../../services/admin/fetchRoles'
import "../../../styles/main/Sync/SyncUsuariosP.css"

const EMPTY_FORM = { username: '', email: '', role_id: '' }

function UserModal({ title, initial, roles, disableEmail, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.username || !form.role_id || (!disableEmail && !form.email)) {
      setError('Username, email y rol son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, role_id: Number(form.role_id) })
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
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-field">
            <label>Username *</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="username" />
          </div>
          <div className="modal-field">
            <label>Email *</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@pascualbravo.edu.co"
              disabled={disableEmail}
              style={disableEmail ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            />
          </div>
          <div className="modal-field">
            <label>Rol *</label>
            <select name="role_id" value={form.role_id} onChange={handleChange}>
              <option value="">Seleccionar rol...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <p className="modal-hint">El acceso se valida contra el correo institucional (Cognito), aquí solo se asigna el rol.</p>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsuarios() {
  const [users, setUsers]     = useState([])
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser]     = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([fetchPlatformUsers(), fetchRoles()])
      setUsers(u)
      setRoles(r)
    } catch (e) {
      console.error('Error cargando usuarios de plataforma:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role_name?.toLowerCase().includes(q)
    )
  }, [users, search])

  const handleToggleEstado = async (user) => {
    const next = !user.estado
    if (!confirm(`¿${next ? 'Activar' : 'Desactivar'} a ${user.username}?`)) return
    try {
      await togglePlatformUserEstado(user.id, next)
      await loadData()
    } catch (e) {
      console.error('Error cambiando estado:', e.message)
    }
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Usuarios de Plataforma</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Crear Usuario
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por username, email o rol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando usuarios...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role_name || '-'}</td>
                  <td>
                    <span className={`badge ${user.estado ? 'badge-synced' : 'badge-pending'}`}>
                      {user.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{user.last_login ? String(user.last_login).split('T')[0] : '-'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-icon-edit" onClick={() => setEditUser(user)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon" onClick={() => handleToggleEstado(user)} title={user.estado ? 'Desactivar' : 'Activar'}>
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <UserModal
          title="Crear Usuario de Plataforma"
          initial={EMPTY_FORM}
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSave={(form) => createPlatformUser(form).then(loadData)}
        />
      )}
      {editUser && (
        <UserModal
          title="Editar Usuario de Plataforma"
          initial={{ username: editUser.username, email: editUser.email, role_id: editUser.role_id || '' }}
          roles={roles}
          disableEmail
          onClose={() => setEditUser(null)}
          onSave={(form) => updatePlatformUser(editUser.id, { username: form.username, role_id: form.role_id }).then(loadData)}
        />
      )}
    </div>
  )
}
