import { useState, useEffect, useCallback } from 'react'
import { Pencil, ShieldPlus } from 'lucide-react'
import { fetchRoles } from '../../../services/admin/fetchRoles'
import { createRole } from '../../../services/admin/createRole'
import { updateRole } from '../../../services/admin/updateRole'
import "../../../styles/main/Sync/SyncUsuariosP.css"

const EMPTY_FORM = { name: '', description: '' }

function RoleModal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.name) {
      setError('El nombre del rol es obligatorio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
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
            <label>Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="ej. gestor" />
          </div>
          <div className="modal-field">
            <label>Descripción</label>
            <input name="description" value={form.description || ''} onChange={handleChange} placeholder="Descripción del alcance del rol" />
          </div>
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

export default function AdminRoles() {
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editRole, setEditRole]     = useState(null)

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      setRoles(await fetchRoles())
    } catch (e) {
      console.error('Error cargando roles:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Roles</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <ShieldPlus size={15} /> Crear Rol
        </button>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando roles...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td data-label="Nombre">{role.name}</td>
                  <td data-label="Descripción">{role.description || '-'}</td>
                  <td data-label="Tipo">
                    {role.is_system_default
                      ? <span className="badge badge-db">Sistema</span>
                      : <span className="badge badge-pending">Personalizado</span>}
                  </td>
                  <td data-label="Acciones">
                    <div className="action-btns">
                      <button className="btn-icon btn-icon-edit" onClick={() => setEditRole(role)} title="Editar">
                        <Pencil size={14} />
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
        <RoleModal
          title="Crear Rol"
          initial={EMPTY_FORM}
          onClose={() => setShowCreate(false)}
          onSave={(form) => createRole(form).then(loadRoles)}
        />
      )}
      {editRole && (
        <RoleModal
          title="Editar Rol"
          initial={{ name: editRole.name, description: editRole.description || '' }}
          onClose={() => setEditRole(null)}
          onSave={(form) => updateRole(editRole.id, form).then(loadRoles)}
        />
      )}
    </div>
  )
}
