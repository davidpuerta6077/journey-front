import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pencil, Boxes, Layers } from 'lucide-react'
import { fetchModulos } from '../../../services/admin/fetchModulos'
import { createModulo } from '../../../services/admin/createModulo'
import { updateModulo } from '../../../services/admin/updateModulo'
import { fetchSubmodulos } from '../../../services/admin/fetchSubmodulos'
import { createSubmodulo } from '../../../services/admin/createSubmodulo'
import { updateSubmodulo } from '../../../services/admin/updateSubmodulo'
import "../../../styles/main/Sync/SyncUsuariosP.css"

function ModuloModal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.code || !form.name) {
      setError('Código y nombre son obligatorios.')
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
            <label>Código *</label>
            <input name="code" value={form.code} onChange={handleChange} placeholder="ej. reportes_bi" />
          </div>
          <div className="modal-field">
            <label>Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="ej. Reportes BI" />
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

function SubmoduloModal({ title, initial, modulos, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.module_id || !form.code || !form.name) {
      setError('Módulo, código y nombre son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, module_id: Number(form.module_id) })
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
            <label>Módulo *</label>
            <select name="module_id" value={form.module_id} onChange={handleChange}>
              <option value="">Seleccionar módulo...</option>
              {modulos.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <label>Código *</label>
            <input name="code" value={form.code} onChange={handleChange} placeholder="ej. bi_dashboards" />
          </div>
          <div className="modal-field">
            <label>Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="ej. Dashboards" />
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

export default function AdminModulos() {
  const [modulos, setModulos]       = useState([])
  const [submodulos, setSubmodulos] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterModulo, setFilterModulo] = useState('')

  const [showCreateModulo, setShowCreateModulo] = useState(false)
  const [editModulo, setEditModulo]              = useState(null)
  const [showCreateSub, setShowCreateSub]        = useState(false)
  const [editSub, setEditSub]                    = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [m, s] = await Promise.all([fetchModulos(), fetchSubmodulos()])
      setModulos(m)
      setSubmodulos(s)
    } catch (e) {
      console.error('Error cargando módulos:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredSubs = useMemo(() => {
    if (!filterModulo) return submodulos
    return submodulos.filter(s => String(s.module_id) === filterModulo)
  }, [submodulos, filterModulo])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Módulos y Submódulos</h2>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando módulos...</div>
      ) : (
        <>
          <div className="sync-page-header" style={{ marginTop: 8 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Boxes size={16} /> Módulos</h3>
            <button className="btn-secondary" onClick={() => setShowCreateModulo(true)}>Crear Módulo</button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Código</th><th>Nombre</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {modulos.map(m => (
                  <tr key={m.id}>
                    <td><code>{m.code}</code></td>
                    <td>{m.name}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-icon-edit" onClick={() => setEditModulo(m)} title="Editar">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sync-page-header" style={{ marginTop: 24 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={16} /> Submódulos</h3>
            <button className="btn-secondary" onClick={() => setShowCreateSub(true)}>Crear Submódulo</button>
          </div>
          <div className="filters-bar">
            <select className="filter-select" value={filterModulo} onChange={e => setFilterModulo(e.target.value)}>
              <option value="">Todos los módulos</option>
              {modulos.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <span className="results-count">{filteredSubs.length} resultado{filteredSubs.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Módulo</th><th>Código</th><th>Nombre</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filteredSubs.map(s => (
                  <tr key={s.id}>
                    <td>{s.module_name}</td>
                    <td><code>{s.code}</code></td>
                    <td>{s.name}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-icon-edit" onClick={() => setEditSub(s)} title="Editar">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCreateModulo && (
        <ModuloModal
          title="Crear Módulo"
          initial={{ code: '', name: '' }}
          onClose={() => setShowCreateModulo(false)}
          onSave={(form) => createModulo(form).then(loadData)}
        />
      )}
      {editModulo && (
        <ModuloModal
          title="Editar Módulo"
          initial={{ code: editModulo.code, name: editModulo.name }}
          onClose={() => setEditModulo(null)}
          onSave={(form) => updateModulo(editModulo.id, form).then(loadData)}
        />
      )}
      {showCreateSub && (
        <SubmoduloModal
          title="Crear Submódulo"
          initial={{ module_id: filterModulo || '', code: '', name: '' }}
          modulos={modulos}
          onClose={() => setShowCreateSub(false)}
          onSave={(form) => createSubmodulo(form).then(loadData)}
        />
      )}
      {editSub && (
        <SubmoduloModal
          title="Editar Submódulo"
          initial={{ module_id: editSub.module_id, code: editSub.code, name: editSub.name }}
          modulos={modulos}
          onClose={() => setEditSub(null)}
          onSave={(form) => updateSubmodulo(editSub.id, form).then(loadData)}
        />
      )}
    </div>
  )
}
