import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getEventosGoogle } from '../../../services/onix/getEventosGoogle'
import { createRegistroDesdeGoogle } from '../../../services/onix/createRegistroDesdeGoogle'
import { alertError, toastExito } from '../../../services/alerts'
import { MESES } from './periodo'
import { plural, tituloDe } from './evidencias'

const fecha = (e) => new Date(e.todoElDia ? `${e.inicio}T12:00:00` : e.inicio)
  .toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: '2-digit' })
const hora = (e) => (e.todoElDia ? 'Todo el día'
  : new Date(e.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
const duracion = (min) => (!min ? '' : [Math.floor(min / 60) && `${Math.floor(min / 60)} h`, min % 60 && `${min % 60} min`].filter(Boolean).join(' '))

// Los eventos que se repiten (misma reunión cada semana) van juntos.
function agrupar(eventos) {
  const grupos = new Map()
  for (const e of eventos) {
    const clave = e.titulo.toLowerCase()
    if (!grupos.has(clave)) grupos.set(clave, { titulo: e.titulo, eventos: [] })
    grupos.get(clave).eventos.push(e)
  }
  return [...grupos.values()].map((g) => ({ ...g, ids: g.eventos.map((e) => e.id) }))
}

// Checkbox con estado intermedio cuando solo parte del grupo está elegida.
function Casilla({ ids, elegidos, onCambio, label }) {
  const marcados = ids.filter((id) => elegidos.has(id)).length
  return (
    <input type="checkbox" aria-label={label} checked={marcados === ids.length}
      ref={(el) => { if (el) el.indeterminate = marcados > 0 && marcados < ids.length }}
      onChange={() => onCambio(ids, marcados < ids.length)} />
  )
}

// Eventos del mes de Google Calendar aún no usados; se agregan como
// subactividades nuevas o a una existente.
export default function TraerGoogleModal({ actividad, periodo, registros = [], onClose, onAgregado }) {
  const [eventos, setEventos] = useState(null)
  const [error, setError] = useState(null)
  const [elegidos, setElegidos] = useState(new Set())
  const [abiertos, setAbiertos] = useState(new Set())
  const [destino, setDestino] = useState(null) // null = automático
  const [titulo, setTitulo] = useState(null) // null = automático
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getEventosGoogle(periodo).then(setEventos).catch((e) => { setError(e.message); setEventos([]) })
  }, [periodo])

  const grupos = useMemo(() => agrupar(eventos || []), [eventos])
  const gruposElegidos = grupos
    .map((g) => ({ ...g, ids: g.ids.filter((id) => elegidos.has(id)) }))
    .filter((g) => g.ids.length)

  const marcar = (ids, si) => setElegidos((prev) => {
    const s = new Set(prev)
    ids.forEach((id) => (si ? s.add(id) : s.delete(id)))
    return s
  })
  const alternarAbierto = (clave) => setAbiertos((prev) => {
    const s = new Set(prev)
    if (s.has(clave)) s.delete(clave)
    else s.add(clave)
    return s
  })

  const porGrupo = gruposElegidos.length > 1
  const destinoEf = destino === 'grupo' && !porGrupo ? 'una' : destino ?? 'una'
  const tituloEf = titulo ?? (gruposElegidos.length === 1 ? gruposElegidos[0].titulo.slice(0, 200) : 'Reuniones y eventos del mes')

  const agregar = async () => {
    setEnviando(true)
    const base = { actividad_id: actividad.id, ...periodo }
    try {
      if (destinoEf === 'grupo') {
        for (const g of gruposElegidos) await createRegistroDesdeGoogle({ ...base, titulo: g.titulo.slice(0, 200), evento_ids: g.ids })
        toastExito(plural(gruposElegidos.length, 'subactividad creada', 'subactividades creadas'))
      } else if (destinoEf === 'una') {
        await createRegistroDesdeGoogle({ ...base, titulo: tituloEf, evento_ids: [...elegidos] })
        toastExito('Subactividad creada')
      } else {
        await createRegistroDesdeGoogle({ ...base, registro_id: Number(destinoEf), evento_ids: [...elegidos] })
        toastExito('Eventos agregados a la subactividad')
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
          <h3>Mi Google Calendar — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-form">
          {error ? (
            <p className="onix-aviso">{error}</p>
          ) : (
            <p className="modal-hint">
              Tus reuniones y eventos del mes. Las reuniones que se repiten van juntas. Marca lo que hiciste para "{actividad.nombre}";
              lo que ya agregaste antes no aparece.
            </p>
          )}

          {eventos === null ? (
            <div className="loading-box"><span className="loader"></span>Leyendo tu calendario...</div>
          ) : !error && grupos.length === 0 ? (
            <p className="onix-vacio">No hay eventos pendientes de agregar en este mes.</p>
          ) : (
            <div className="onix-logs-lista">
              {grupos.map((g) => {
                const clave = g.titulo.toLowerCase()
                const abierto = abiertos.has(clave)
                const unico = g.eventos.length === 1 ? g.eventos[0] : null
                return (
                  <section key={clave} className="onix-logs-grupo">
                    <div className="onix-logs-grupo-head">
                      <label className="onix-logs-grupo-nombre">
                        <Casilla ids={g.ids} elegidos={elegidos} onCambio={marcar} label={`Elegir ${g.titulo}`} />
                        <strong>{g.titulo}</strong>
                        <span className="onix-informe-meta">
                          {unico
                            ? [fecha(unico), hora(unico), duracion(unico.duracionMin), unico.asistentes > 1 && `${unico.asistentes} asistentes`].filter(Boolean).join(' · ')
                            : plural(g.eventos.length, 'vez', 'veces')}
                        </span>
                      </label>
                      {!unico && (
                        <button type="button" className="onix-agregar-enlace" aria-expanded={abierto} onClick={() => alternarAbierto(clave)}>
                          {abierto ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                          {abierto ? 'Ocultar fechas' : 'Ver fechas'}
                        </button>
                      )}
                    </div>
                    {abierto && !unico && (
                      <ul className="onix-logs-filas">
                        {g.eventos.map((e) => (
                          <li key={e.id}>
                            <label>
                              <Casilla ids={[e.id]} elegidos={elegidos} onCambio={marcar} label={`Elegir ${g.titulo} del ${fecha(e)}`} />
                              <span>{fecha(e)}</span>
                              <span className="onix-informe-meta">{[hora(e), duracion(e.duracionMin), e.asistentes > 1 && `${e.asistentes} asistentes`].filter(Boolean).join(' · ')}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          )}

          {elegidos.size > 0 && (
            <div className="onix-logs-destino">
              <div className="modal-field">
                <label htmlFor="google-destino">¿Dónde agregarlos?</label>
                <select id="google-destino" className="filter-select" value={destinoEf} onChange={(e) => setDestino(e.target.value)}>
                  <option value="una">Una sola subactividad nueva</option>
                  {porGrupo && <option value="grupo">Una subactividad nueva por cada reunión o evento ({gruposElegidos.length})</option>}
                  {registros.length > 0 && (
                    <optgroup label="Agregar a una subactividad existente">
                      {registros.map((r) => <option key={r.id} value={r.id}>{tituloDe(r)}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              {destinoEf === 'una' && (
                <div className="modal-field">
                  <label htmlFor="google-titulo">Título de la subactividad</label>
                  <input id="google-titulo" value={tituloEf} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={!elegidos.size || enviando || (destinoEf === 'una' && !tituloEf.trim())} onClick={agregar}>
            {enviando ? 'Agregando...' : `Agregar${elegidos.size ? ` ${plural(elegidos.size, 'evento', 'eventos')}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
