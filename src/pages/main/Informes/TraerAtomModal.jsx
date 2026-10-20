import { useEffect, useState } from 'react'
import { getTareasAtom } from '../../../services/onix/getTareasAtom'
import { createRegistroDesdeAtom } from '../../../services/onix/createRegistroDesdeAtom'
import { alertError, toastExito } from '../../../services/alerts'
import { MESES } from './periodo'
import { plural, tituloDe } from './evidencias'

const fecha = (t) => new Date(t.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: '2-digit' })
const BADGE = { Completada: 'badge-synced', 'En proceso': 'badge-pending', 'En revisión': 'badge-pending' }

// Tareas de Atom (asignadas a mí o creadas por mí sin asignar) completadas en
// el mes o en proceso/revisión con movimiento en el mes. Una tarea larga puede
// agregarse una vez por mes.
export default function TraerAtomModal({ actividad, periodo, registros = [], onClose, onAgregado }) {
  const [tareas, setTareas] = useState(null)
  const [error, setError] = useState(null)
  const [elegidos, setElegidos] = useState(new Set())
  const [destino, setDestino] = useState(null) // null = automático
  const [titulo, setTitulo] = useState(null) // null = automático
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getTareasAtom(periodo).then(setTareas).catch((e) => { setError(e.message); setTareas([]) })
  }, [periodo])

  const lista = tareas || []
  const seleccion = lista.filter((t) => elegidos.has(t.id))
  const variosElegidos = seleccion.length > 1
  const destinoEf = destino === 'cada' && !variosElegidos ? 'una' : destino ?? 'una'
  const tituloEf = titulo ?? (seleccion.length === 1 ? seleccion[0].titulo.slice(0, 200) : 'Tareas del mes')

  const alternar = (id) => setElegidos((prev) => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    return s
  })

  const agregar = async () => {
    setEnviando(true)
    const base = { actividad_id: actividad.id, ...periodo }
    try {
      if (destinoEf === 'cada') {
        for (const t of seleccion) await createRegistroDesdeAtom({ ...base, titulo: t.titulo.slice(0, 200), tarea_ids: [t.id] })
        toastExito(plural(seleccion.length, 'subactividad creada', 'subactividades creadas'))
      } else if (destinoEf === 'una') {
        await createRegistroDesdeAtom({ ...base, titulo: tituloEf, tarea_ids: [...elegidos] })
        toastExito('Subactividad creada')
      } else {
        await createRegistroDesdeAtom({ ...base, registro_id: Number(destinoEf), tarea_ids: [...elegidos] })
        toastExito('Tareas agregadas a la subactividad')
      }
      onAgregado()
    } catch (e) {
      alertError(e.message)
      onAgregado() // lo ya creado queda; recarga para mostrarlo
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box onix-modal-ancho">
        <div className="modal-header">
          <h3>Mis tareas de Atom — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-form">
          {error ? (
            <p className="onix-aviso">{error}</p>
          ) : (
            <p className="modal-hint">
              Tus tareas completadas este mes y las que siguen en proceso o en revisión con avances en el mes.
              Marca las que tengan que ver con "{actividad.nombre}"; las que ya agregaste este mes no aparecen.
            </p>
          )}

          {tareas === null ? (
            <div className="loading-box"><span className="loader"></span>Leyendo tus tareas...</div>
          ) : !error && lista.length === 0 ? (
            <p className="onix-vacio">No hay tareas de Atom pendientes de agregar en este mes.</p>
          ) : (
            <div className="onix-logs-lista">
              {lista.map((t) => (
                <section key={t.id} className="onix-logs-grupo">
                  <div className="onix-logs-grupo-head">
                    <label className="onix-logs-grupo-nombre">
                      <input type="checkbox" aria-label={`Elegir ${t.titulo}`} checked={elegidos.has(t.id)} onChange={() => alternar(t.id)} />
                      <strong>{t.titulo}</strong>
                      <span className={`badge ${BADGE[t.estado] || 'badge-pending'}`}>{t.estado}</span>
                      <span className="onix-informe-meta">
                        {[fecha(t), t.subtareas > 0 && `${t.subtareasHechas}/${t.subtareas} subtareas`].filter(Boolean).join(' · ')}
                      </span>
                    </label>
                  </div>
                </section>
              ))}
            </div>
          )}

          {elegidos.size > 0 && (
            <div className="onix-logs-destino">
              <div className="modal-field">
                <label htmlFor="atom-destino">¿Dónde agregarlas?</label>
                <select id="atom-destino" className="filter-select" value={destinoEf} onChange={(e) => setDestino(e.target.value)}>
                  <option value="una">Una sola subactividad nueva</option>
                  {variosElegidos && <option value="cada">Una subactividad nueva por cada tarea ({seleccion.length})</option>}
                  {registros.length > 0 && (
                    <optgroup label="Agregar a una subactividad existente">
                      {registros.map((r) => <option key={r.id} value={r.id}>{tituloDe(r)}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              {destinoEf === 'una' && (
                <div className="modal-field">
                  <label htmlFor="atom-titulo">Título de la subactividad</label>
                  <input id="atom-titulo" value={tituloEf} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={!elegidos.size || enviando || (destinoEf === 'una' && !tituloEf.trim())} onClick={agregar}>
            {enviando ? 'Agregando...' : `Agregar${elegidos.size ? ` ${plural(elegidos.size, 'tarea', 'tareas')}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
