import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getAreas, createArea, updateArea, deleteArea } from '../../../services/onix/onixApi'
import { alertError, confirmEliminar, toastExito } from '../../../services/alerts'

const VACIA = { nombre: '', color: '#19445e' }

export default function AdminTab() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // null | 'nueva' | area
  const [form, setForm] = useState(VACIA)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setAreas(await getAreas())
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando === 'nueva') await createArea(form)
      else await updateArea(editando.id, form)
      toastExito('Área guardada')
      setEditando(null)
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  const eliminar = async (area) => {
    if (!(await confirmEliminar({ text: `Se eliminará el área "${area.nombre}". Los perfiles que la tengan quedarán sin área.` }))) return
    try {
      await deleteArea(area.id)
      toastExito('Área eliminada')
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  return (
    <div>
      <div className="onix-toolbar">
        <h3>Áreas</h3>
        <button className="btn-primary" onClick={() => { setEditando('nueva'); setForm(VACIA) }}><Plus size={16} /> Nueva área</button>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : areas.length === 0 ? (
        <p className="onix-vacio">No hay áreas creadas.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Área</th><th></th></tr></thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id}>
                  <td><span className="onix-area-color" style={{ background: a.color }} aria-hidden="true"></span>{a.nombre}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-icon-edit" title="Editar" aria-label={`Editar ${a.nombre}`} onClick={() => { setEditando(a); setForm({ nombre: a.nombre, color: a.color }) }}><Pencil size={15} /></button>
                      <button className="btn-icon btn-icon-delete" title="Eliminar" aria-label={`Eliminar ${a.nombre}`} onClick={() => eliminar(a)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditando(null)}>
          <form className="modal-box modal-form" onSubmit={guardar}>
            <div className="modal-header">
              <h3>{editando === 'nueva' ? 'Nueva área' : 'Editar área'}</h3>
              <button type="button" className="modal-close" onClick={() => setEditando(null)} aria-label="Cerrar">×</button>
            </div>
            <label className="modal-field">
              <span>Nombre *</span>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={100} required autoFocus />
            </label>
            <label className="modal-field">
              <span>Color</span>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
