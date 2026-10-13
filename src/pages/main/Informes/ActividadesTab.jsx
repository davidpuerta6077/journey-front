import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { getActividades, createActividad, updateActividad, deleteActividad } from '../../../services/onix/onixApi'
import { alertError, confirmEliminar, toastExito } from '../../../services/alerts'
import RegistrosView from './RegistrosView'

const VACIA = { nombre: '', descripcion: '', orden: 0 }

export default function ActividadesTab() {
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // null | 'nueva' | actividad
  const [form, setForm] = useState(VACIA)
  const [abierta, setAbierta] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setActividades(await getActividades())
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirForm = (act) => {
    setEditando(act || 'nueva')
    setForm(act ? { nombre: act.nombre, descripcion: act.descripcion, orden: act.orden } : { ...VACIA, orden: actividades.length })
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando === 'nueva') await createActividad(form)
      else await updateActividad(editando.id, form)
      toastExito('Actividad guardada')
      setEditando(null)
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  const eliminar = async (act) => {
    const ok = await confirmEliminar({ text: `Se eliminará "${act.nombre}" con todos sus registros, evidencias e informes.` })
    if (!ok) return
    try {
      await deleteActividad(act.id)
      toastExito('Actividad eliminada')
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  if (abierta) return <RegistrosView actividad={abierta} onVolver={() => setAbierta(null)} />

  return (
    <div>
      <div className="onix-toolbar">
        <h3>Actividades del contrato</h3>
        <button className="btn-primary" onClick={() => abrirForm(null)}><Plus size={16} /> Nueva actividad</button>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando actividades...</div>
      ) : actividades.length === 0 ? (
        <p className="onix-vacio">Aún no tienes actividades. Crea las actividades de tu contrato para empezar a registrar tu trabajo.</p>
      ) : (
        <div className="onix-grid">
          {actividades.map((act, i) => (
            <div key={act.id} className="onix-card onix-actividad">
              <button className="onix-actividad-abrir" onClick={() => setAbierta(act)} aria-label={`Abrir registros de ${act.nombre}`}>
                <span className="onix-num">Actividad {i + 1}</span>
                <h4>{act.nombre}</h4>
                <p>{act.descripcion}</p>
                <span className="onix-link">Ver registros <ChevronRight size={14} /></span>
              </button>
              <div className="action-btns">
                <button className="btn-icon btn-icon-edit" title="Editar" aria-label="Editar actividad" onClick={() => abrirForm(act)}><Pencil size={15} /></button>
                <button className="btn-icon btn-icon-delete" title="Eliminar" aria-label="Eliminar actividad" onClick={() => eliminar(act)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditando(null)}>
          <form className="modal-box modal-form" onSubmit={guardar}>
            <div className="modal-header">
              <h3>{editando === 'nueva' ? 'Nueva actividad' : 'Editar actividad'}</h3>
              <button type="button" className="modal-close" onClick={() => setEditando(null)} aria-label="Cerrar">×</button>
            </div>
            <label className="modal-field">
              <span>Nombre *</span>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={200} required autoFocus />
            </label>
            <label className="modal-field">
              <span>Descripción contractual *</span>
              <textarea rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
            </label>
            <label className="modal-field">
              <span>Orden en el informe</span>
              <input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
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
