import { useEffect, useState } from 'react'
import { getCorreosGoogle } from '../../../services/onix/getCorreosGoogle'
import { createRegistroDesdeCorreo } from '../../../services/onix/createRegistroDesdeCorreo'
import { alertError, toastExito } from '../../../services/alerts'
import { MESES } from './periodo'
import { plural, tituloDe } from './evidencias'

const fecha = (c) => new Date(c.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: '2-digit' })
const para = (c) => (c.para.length ? `a ${c.para.slice(0, 3).join(', ')}${c.para.length > 3 ? ` y ${c.para.length - 3} más` : ''}` : '')

// Correos enviados del mes (una fila por conversación) aún no usados; se
// agregan como subactividades nuevas o a una existente. Solo se lee asunto,
// destinatarios y fecha, nunca el contenido.
export default function TraerCorreoModal({ actividad, periodo, registros = [], onClose, onAgregado }) {
  const [correos, setCorreos] = useState(null)
  const [error, setError] = useState(null)
  const [elegidos, setElegidos] = useState(new Set())
  const [destino, setDestino] = useState(null) // null = automático
  const [titulo, setTitulo] = useState(null) // null = automático
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getCorreosGoogle(periodo).then(setCorreos).catch((e) => { setError(e.message); setCorreos([]) })
  }, [periodo])

  const lista = correos || []
  const seleccion = lista.filter((c) => elegidos.has(c.id))
  const variosElegidos = seleccion.length > 1
  const destinoEf = destino === 'cada' && !variosElegidos ? 'una' : destino ?? 'una'
  const tituloEf = titulo ?? (seleccion.length === 1 ? seleccion[0].asunto.slice(0, 200) : 'Gestión por correo electrónico')

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
        for (const c of seleccion) await createRegistroDesdeCorreo({ ...base, titulo: c.asunto.slice(0, 200), correo_ids: [c.id] })
        toastExito(plural(seleccion.length, 'subactividad creada', 'subactividades creadas'))
      } else if (destinoEf === 'una') {
        await createRegistroDesdeCorreo({ ...base, titulo: tituloEf, correo_ids: [...elegidos] })
        toastExito('Subactividad creada')
      } else {
        await createRegistroDesdeCorreo({ ...base, registro_id: Number(destinoEf), correo_ids: [...elegidos] })
        toastExito('Correos agregados a la subactividad')
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
          <h3>Mis correos enviados — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-form">
          {error ? (
            <p className="onix-aviso">{error}</p>
          ) : (
            <p className="modal-hint">
              Los correos que enviaste este mes, una fila por conversación. Bravo Hub solo ve el asunto, a quién y cuándo, no el contenido.
              Marca los que tengan que ver con "{actividad.nombre}"; lo que ya agregaste antes no aparece.
            </p>
          )}

          {correos === null ? (
            <div className="loading-box"><span className="loader"></span>Leyendo tus correos enviados... puede tardar unos segundos.</div>
          ) : !error && lista.length === 0 ? (
            <p className="onix-vacio">No hay correos enviados pendientes de agregar en este mes.</p>
          ) : (
            <div className="onix-logs-lista">
              {lista.map((c) => (
                <section key={c.id} className="onix-logs-grupo">
                  <div className="onix-logs-grupo-head">
                    <label className="onix-logs-grupo-nombre">
                      <input type="checkbox" aria-label={`Elegir ${c.asunto}`} checked={elegidos.has(c.id)} onChange={() => alternar(c.id)} />
                      <strong>{c.asunto}</strong>
                      <span className="onix-informe-meta">
                        {[fecha(c), para(c), c.mensajes > 1 && plural(c.mensajes, 'correo', 'correos')].filter(Boolean).join(' · ')}
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
                <label htmlFor="correo-destino">¿Dónde agregarlos?</label>
                <select id="correo-destino" className="filter-select" value={destinoEf} onChange={(e) => setDestino(e.target.value)}>
                  <option value="una">Una sola subactividad nueva</option>
                  {variosElegidos && <option value="cada">Una subactividad nueva por cada conversación ({seleccion.length})</option>}
                  {registros.length > 0 && (
                    <optgroup label="Agregar a una subactividad existente">
                      {registros.map((r) => <option key={r.id} value={r.id}>{tituloDe(r)}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              {destinoEf === 'una' && (
                <div className="modal-field">
                  <label htmlFor="correo-titulo">Título de la subactividad</label>
                  <input id="correo-titulo" value={tituloEf} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={!elegidos.size || enviando || (destinoEf === 'una' && !tituloEf.trim())} onClick={agregar}>
            {enviando ? 'Agregando...' : `Agregar${elegidos.size ? ` ${plural(elegidos.size, 'correo', 'correos')}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
