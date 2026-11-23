import { useState, useEffect, useCallback } from 'react'
import { Save, Plus, Pencil, Trash2, X, Power } from 'lucide-react'
import { listarRequerimientos } from '../../../services/asignia/listarRequerimientos'
import { crearRequerimiento } from '../../../services/asignia/crearRequerimiento'
import { actualizarRequerimiento } from '../../../services/asignia/actualizarRequerimiento'
import { listarNiveles } from '../../../services/asignia/listarNiveles'
import { crearNivel } from '../../../services/asignia/crearNivel'
import { actualizarNivel } from '../../../services/asignia/actualizarNivel'
import { borrarNivel } from '../../../services/asignia/borrarNivel'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'

// Catálogo de requerimientos técnicos/profesionales (RF-04.1): crear, editar y desactivar.
// Uno inactivo deja de aparecer para asignar y no cuenta en las coincidencias.
export function Requerimientos({ puedeEditar, onCambio }) {
  const [lista, setLista] = useState(null)
  const [form, setForm] = useState({ id: null, nombre: '' })
  const [guardando, setGuardando] = useState(false)
  const cargar = useCallback(() => listarRequerimientos().then(setLista).catch((e) => { setLista([]); alertError(e.message) }), [])
  useEffect(() => { cargar() }, [cargar])
  const listo = () => { cargar(); onCambio?.() }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (form.id) await actualizarRequerimiento(form.id, { nombre: form.nombre })
      else await crearRequerimiento(form.nombre)
      toastExito(form.id ? 'Requerimiento actualizado' : 'Requerimiento creado')
      setForm({ id: null, nombre: '' })
      listo()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  const alternar = async (r) => {
    if (r.activo && !(await confirmAccion({
      title: '¿Desactivar el requerimiento?',
      text: `"${r.nombre}" dejará de contar en las coincidencias entre cursos y profesores. Puedes activarlo de nuevo.`,
      confirmButtonText: 'Sí, desactivar',
    }))) return
    try {
      await actualizarRequerimiento(r.id, { activo: !r.activo })
      toastExito(r.activo ? 'Requerimiento desactivado' : 'Requerimiento activado')
      listo()
    } catch (err) { alertError(err.message) }
  }

  return (
    <section className="cal-config-bloque">
      <h3>Requerimientos técnicos y profesionales</h3>
      <p className="asignia-ayuda">Lista maestra para el perfil de cursos y profesores (ej. Programación, Python, Java). Se asignan en "Editar curso" y "Editar profesor".</p>
      {puedeEditar && (
        <form className="cal-config-fila" onSubmit={guardar}>
          <div className="modal-field cal-config-ancho"><label htmlFor="req-nombre">Nombre</label><input id="req-nombre" required maxLength={120} value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Ingeniería de software" /></div>
          <div className="cal-config-acciones">
            {form.id && <button type="button" className="btn-secondary" onClick={() => setForm({ id: null, nombre: '' })}><X size={15} /> Cancelar</button>}
            <button className="btn-primary" type="submit" disabled={guardando}>{form.id ? <><Save size={15} /> Guardar cambios</> : <><Plus size={15} /> Agregar</>}</button>
          </div>
        </form>
      )}
      {lista === null ? <div className="loading-box"><span className="loader"></span>Cargando...</div>
        : lista.length === 0 ? <p className="asignia-ayuda">Aún no hay requerimientos.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Requerimiento</th><th>Estado</th>{puedeEditar && <th>Acciones</th>}</tr></thead>
              <tbody>
                {lista.map(r => (
                  <tr key={r.id}>
                    <td data-label="Requerimiento">{r.nombre}</td>
                    <td data-label="Estado"><span className={`badge ${r.activo ? 'badge-synced' : 'badge-pending'}`}>{r.activo ? 'Activo' : 'Inactivo'}</span></td>
                    {puedeEditar && (
                      <td data-label="Acciones">
                        <div className="cal-config-acciones-fila">
                          <button type="button" className="btn-icon" onClick={() => setForm({ id: r.id, nombre: r.nombre })} aria-label={`Editar ${r.nombre}`}><Pencil size={15} /></button>
                          <button type="button" className="btn-icon" onClick={() => alternar(r)} aria-label={`${r.activo ? 'Desactivar' : 'Activar'} ${r.nombre}`} title={r.activo ? 'Desactivar' : 'Activar'}><Power size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  )
}

const NIVEL_VACIO = { id: null, nombre: '', min_horas: '', max_horas: '' }

// Niveles académicos con rango de horas (RF-05). Cada profesor tiene uno; las alertas
// comparan sus horas acumuladas con el mínimo y el máximo.
export function NivelesAcademicos({ puedeEditar, onCambio }) {
  const [lista, setLista] = useState(null)
  const [form, setForm] = useState(NIVEL_VACIO)
  const [guardando, setGuardando] = useState(false)
  const cargar = useCallback(() => listarNiveles().then(setLista).catch((e) => { setLista([]); alertError(e.message) }), [])
  useEffect(() => { cargar() }, [cargar])
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const listo = () => { cargar(); onCambio?.() }
  const rangoMal = form.min_horas !== '' && form.max_horas !== '' && Number(form.min_horas) > Number(form.max_horas)

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const datos = { nombre: form.nombre, min_horas: form.min_horas, max_horas: form.max_horas }
      if (form.id) await actualizarNivel(form.id, datos)
      else await crearNivel(datos)
      toastExito(form.id ? 'Nivel actualizado' : 'Nivel creado')
      setForm(NIVEL_VACIO)
      listo()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  const borrar = async (n) => {
    if (!(await confirmAccion({
      title: '¿Borrar el nivel académico?',
      text: `${n.nombre}${n.profesores ? `: ${n.profesores} profesor(es) quedarán sin nivel académico` : ''}.`,
      icon: 'warning',
      confirmButtonText: 'Sí, borrar',
    }))) return
    try {
      await borrarNivel(n.id)
      toastExito('Nivel borrado')
      if (form.id === n.id) setForm(NIVEL_VACIO)
      listo()
    } catch (err) { alertError(err.message) }
  }

  return (
    <section className="cal-config-bloque">
      <h3>Niveles académicos</h3>
      <p className="asignia-ayuda">Rango de horas semanales por nivel. Alerta de mínimo si el profesor tiene menos que el mínimo; de cupo alcanzado si llega al máximo.</p>
      {puedeEditar && (
        <form className="cal-config-fila" onSubmit={guardar}>
          <div className="modal-field cal-config-ancho"><label htmlFor="niv-nombre">Nombre</label><input id="niv-nombre" required maxLength={120} value={form.nombre} onChange={set('nombre')} placeholder="Ej. Magíster" /></div>
          <div className="modal-field"><label htmlFor="niv-min">Horas mínimas</label><input id="niv-min" type="number" required min={0} step="0.5" value={form.min_horas} onChange={set('min_horas')} /></div>
          <div className="modal-field"><label htmlFor="niv-max">Horas máximas</label><input id="niv-max" type="number" required min={0} step="0.5" value={form.max_horas} onChange={set('max_horas')} aria-invalid={rangoMal} /></div>
          <div className="cal-config-acciones">
            {form.id && <button type="button" className="btn-secondary" onClick={() => setForm(NIVEL_VACIO)}><X size={15} /> Cancelar</button>}
            <button className="btn-primary" type="submit" disabled={guardando || rangoMal}>{form.id ? <><Save size={15} /> Guardar cambios</> : <><Plus size={15} /> Agregar</>}</button>
          </div>
          {rangoMal && <p className="asignia-aviso" role="alert">Las horas mínimas no pueden ser mayores que las máximas.</p>}
        </form>
      )}
      {lista === null ? <div className="loading-box"><span className="loader"></span>Cargando...</div>
        : lista.length === 0 ? <p className="asignia-ayuda">Aún no hay niveles académicos.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Nivel</th><th>Mínimo</th><th>Máximo</th><th>Profesores</th>{puedeEditar && <th>Acciones</th>}</tr></thead>
              <tbody>
                {lista.map(n => (
                  <tr key={n.id}>
                    <td data-label="Nivel">{n.nombre}</td>
                    <td data-label="Mínimo">{n.min_horas} h</td>
                    <td data-label="Máximo">{n.max_horas} h</td>
                    <td data-label="Profesores">{n.profesores}</td>
                    {puedeEditar && (
                      <td data-label="Acciones">
                        <div className="cal-config-acciones-fila">
                          <button type="button" className="btn-icon" onClick={() => setForm({ id: n.id, nombre: n.nombre, min_horas: String(n.min_horas), max_horas: String(n.max_horas) })} aria-label={`Editar ${n.nombre}`}><Pencil size={15} /></button>
                          <button type="button" className="btn-icon" onClick={() => borrar(n)} aria-label={`Borrar ${n.nombre}`}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  )
}
