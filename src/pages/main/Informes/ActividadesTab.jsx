import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getActividades } from '../../../services/onix/getActividades'
import { createActividad } from '../../../services/onix/createActividad'
import { updateActividad } from '../../../services/onix/updateActividad'
import { deleteActividad } from '../../../services/onix/deleteActividad'
import { alertError, confirmEliminar, toastExito } from '../../../services/alerts'

const VACIA = { nombre: '', descripcion: '', orden: 0 }

export default function ActividadesTab() {
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // null | 'nueva' | actividad
  const [form, setForm] = useState(VACIA)

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

  return (
    <section className="onix-seccion" aria-labelledby="config-actividades">
      <h4 id="config-actividades">Actividades de tu contrato</h4>
      <p className="onix-seccion-ayuda">Las obligaciones de tu contrato. Se crean una vez y cada mes registras en ellas lo que hiciste; el número es el orden en el informe.</p>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando actividades...</div>
      ) : actividades.length === 0 ? (
        <p className="onix-vacio-texto">Aún no tienes actividades. Agrega las de tu contrato y luego registra cada mes lo que hiciste en "Mi mes".</p>
      ) : (
        <ol className="onix-actividades">
          {actividades.map((act, i) => (
            <li key={act.id} className="onix-actividad-fila onix-actividad-config">
              <span className="onix-act-num" aria-hidden="true">{i + 1}</span>
              <span className="onix-actividad-info">
                <span className="onix-actividad-nombre">{act.nombre}</span>
                {act.descripcion && <span className="onix-actividad-desc">{act.descripcion}</span>}
              </span>
              <span className="onix-fila-acciones">
                <button type="button" className="onix-texto-btn" onClick={() => abrirForm(act)} aria-label={`Editar ${act.nombre}`}><Pencil size={15} /> Editar</button>
                <button type="button" className="onix-texto-btn onix-texto-peligro" onClick={() => eliminar(act)} aria-label={`Eliminar ${act.nombre}`}><Trash2 size={15} /> Eliminar</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="btn-secondary onix-agregar" onClick={() => abrirForm(null)}><Plus size={16} /> Agregar actividad</button>

      {editando && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditando(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editando === 'nueva' ? 'Nueva actividad' : 'Editar actividad'}</h3>
              <button type="button" className="modal-close" onClick={() => setEditando(null)} aria-label="Cerrar">×</button>
            </div>
            <form id="actividad-form-1" className="modal-form" onSubmit={guardar}>
              <div className="modal-field">
                <label htmlFor="actividad-1">Nombre *</label>
                <input id="actividad-1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={200} required autoFocus />
              </div>
              <div className="modal-field">
                <label htmlFor="actividad-2">Descripción contractual *</label>
                <textarea id="actividad-2" rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
              </div>
              <div className="modal-field">
                <label htmlFor="actividad-3">Orden en el informe</label>
                <input id="actividad-3" type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
              </div>
            </form>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="submit" form="actividad-form-1" className="btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
