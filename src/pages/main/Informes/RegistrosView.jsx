import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react'
import { getRegistros } from '../../../services/onix/getRegistros'
import { createRegistro } from '../../../services/onix/createRegistro'
import { updateRegistro } from '../../../services/onix/updateRegistro'
import { deleteRegistro } from '../../../services/onix/deleteRegistro'
import { addEvidencia } from '../../../services/onix/addEvidencia'
import { deleteEvidencia } from '../../../services/onix/deleteEvidencia'
import { alertError, confirmEliminar, toastExito } from '../../../services/alerts'
import EvidenciaImagen from './EvidenciaImagen'
import { MESES, periodoActual, aniosDisponibles } from './periodo'

const EV_VACIA = { tipo: 'texto', contenido: '', descripcion: '', archivo: null }

export default function RegistrosView({ actividad, onVolver }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null) // null | 'nuevo' | registro
  const [desarrollo, setDesarrollo] = useState('')
  const [evidenciaDe, setEvidenciaDe] = useState(null) // registro al que se agrega evidencia
  const [ev, setEv] = useState(EV_VACIA)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setRegistros(await getRegistros({ actividad_id: actividad.id, ...periodo }))
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [actividad.id, periodo])

  useEffect(() => { cargar() }, [cargar])

  const guardarRegistro = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      if (editando === 'nuevo') await createRegistro({ actividad_id: actividad.id, ...periodo, desarrollo })
      else await updateRegistro(editando.id, { desarrollo })
      toastExito('Registro guardado')
      setEditando(null)
      cargar()
    } catch (err) {
      alertError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const eliminarRegistro = async (r) => {
    if (!(await confirmEliminar({ text: 'Se eliminará el registro con sus evidencias.' }))) return
    try {
      await deleteRegistro(r.id)
      toastExito('Registro eliminado')
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  const guardarEvidencia = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await addEvidencia({
        registro_id: evidenciaDe.id,
        tipo: ev.tipo,
        descripcion: ev.descripcion,
        ...(ev.tipo === 'imagen' ? { archivo: ev.archivo } : { contenido: ev.contenido }),
      })
      toastExito('Evidencia agregada')
      setEvidenciaDe(null)
      setEv(EV_VACIA)
      cargar()
    } catch (err) {
      alertError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const eliminarEvidencia = async (evidencia) => {
    if (!(await confirmEliminar({ text: 'Se eliminará la evidencia.' }))) return
    try {
      await deleteEvidencia(evidencia.id)
      cargar()
    } catch (err) {
      alertError(err.message)
    }
  }

  return (
    <div>
      <div className="onix-toolbar">
        <button className="btn-secondary" onClick={onVolver}><ArrowLeft size={16} /> Volver</button>
        <h3>{actividad.nombre}</h3>
        <div className="onix-filtros">
          <select className="filter-select" aria-label="Mes" value={periodo.mes} onChange={(e) => setPeriodo({ ...periodo, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" aria-label="Año" value={periodo.anio} onChange={(e) => setPeriodo({ ...periodo, anio: Number(e.target.value) })}>
            {aniosDisponibles().map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setEditando('nuevo'); setDesarrollo('') }}><Plus size={16} /> Nuevo registro</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando registros...</div>
      ) : registros.length === 0 ? (
        <p className="onix-vacio">No hay registros en {MESES[periodo.mes - 1]} de {periodo.anio}.</p>
      ) : registros.map((r) => (
        <div key={r.id} className="onix-card onix-registro">
          <div className="onix-registro-head">
            <p className="onix-registro-texto">{r.desarrollo}</p>
            <div className="action-btns">
              <button className="btn-icon" title="Agregar evidencia" aria-label="Agregar evidencia" onClick={() => { setEvidenciaDe(r); setEv(EV_VACIA) }}><Plus size={15} /></button>
              <button className="btn-icon btn-icon-edit" title="Editar" aria-label="Editar registro" onClick={() => { setEditando(r); setDesarrollo(r.desarrollo) }}><Pencil size={15} /></button>
              <button className="btn-icon btn-icon-delete" title="Eliminar" aria-label="Eliminar registro" onClick={() => eliminarRegistro(r)}><Trash2 size={15} /></button>
            </div>
          </div>
          {r.evidencias.length > 0 && (
            <div className="onix-evidencias">
              {r.evidencias.map((e) => (
                <div key={e.id} className="onix-evidencia">
                  {e.tipo === 'imagen' && <EvidenciaImagen id={e.id} alt={e.descripcion} />}
                  {e.tipo === 'link' && <a href={e.contenido} target="_blank" rel="noreferrer">{e.descripcion || e.contenido}</a>}
                  {e.tipo === 'texto' && <span>{e.descripcion ? `${e.descripcion}: ` : ''}{e.contenido}</span>}
                  {e.tipo === 'imagen' && e.descripcion && <span>{e.descripcion}</span>}
                  <button className="btn-icon btn-icon-delete" title="Quitar evidencia" aria-label="Quitar evidencia" onClick={() => eliminarEvidencia(e)}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {editando && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditando(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editando === 'nuevo' ? 'Nuevo registro' : 'Editar registro'} — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
              <button type="button" className="modal-close" onClick={() => setEditando(null)} aria-label="Cerrar">×</button>
            </div>
            <form id="registro-form-1" className="modal-form" onSubmit={guardarRegistro}>
              <div className="modal-field">
                <label htmlFor="registro-1">¿Qué hiciste? *</label>
                <textarea id="registro-1" rows={5} value={desarrollo} onChange={(e) => setDesarrollo(e.target.value)} required autoFocus />
              </div>
            </form>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="submit" form="registro-form-1" className="btn-primary" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {evidenciaDe && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEvidenciaDe(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Agregar evidencia</h3>
              <button type="button" className="modal-close" onClick={() => setEvidenciaDe(null)} aria-label="Cerrar">×</button>
            </div>
            <form id="registro-form-2" className="modal-form" onSubmit={guardarEvidencia}>
              <div className="onix-tipo-btns" role="group" aria-label="Tipo de evidencia">
                {[['texto', 'Texto'], ['link', 'Enlace'], ['imagen', 'Imagen']].map(([t, l]) => (
                  <button key={t} type="button" className="btn-secondary" aria-pressed={ev.tipo === t}
                    onClick={() => setEv({ ...EV_VACIA, tipo: t, descripcion: ev.descripcion })}>{l}</button>
                ))}
              </div>
              {ev.tipo === 'imagen' ? (
                <div className="modal-field">
                  <label htmlFor="registro-2">Imagen (JPG o PNG, máx. 5 MB) *</label>
                  <input id="registro-2" type="file" accept="image/jpeg,image/png" required onChange={(e) => setEv({ ...ev, archivo: e.target.files[0] || null })} />
                </div>
              ) : (
                <div className="modal-field">
                  <label htmlFor="registro-3">{ev.tipo === 'link' ? 'Enlace (https://...) *' : 'Texto *'}</label>
                  <input id="registro-3" type={ev.tipo === 'link' ? 'url' : 'text'} value={ev.contenido} onChange={(e) => setEv({ ...ev, contenido: e.target.value })} required />
                </div>
              )}
              <div className="modal-field">
                <label htmlFor="registro-4">Descripción</label>
                <input id="registro-4" value={ev.descripcion} onChange={(e) => setEv({ ...ev, descripcion: e.target.value })} maxLength={500} />
              </div>
            </form>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEvidenciaDe(null)}>Cancelar</button>
              <button type="submit" form="registro-form-2" className="btn-primary" disabled={enviando}>{enviando ? 'Subiendo...' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
