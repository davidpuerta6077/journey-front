import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getLogsDisponibles } from '../../../services/onix/getLogsDisponibles'
import { createRegistroDesdeLogs } from '../../../services/onix/createRegistroDesdeLogs'
import { alertError, toastExito } from '../../../services/alerts'
import { MESES } from './periodo'
import { plural, tituloDe } from './evidencias'

const fecha = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })

// Tema de cada acción según su submódulo, para saber a qué subactividad va.
const TEMAS = [
  ['Matrículas', /enroll|matricul/],
  ['Cursos y reglas', /course|curso|rules/],
  ['Usuarios', /user|moodle_|password|perfil/],
  ['Integración SICAU', /sicau/],
  ['Configuración y administración', /settings|admin|reports|statistics|integration/],
]
const temaDe = (l) => TEMAS.find(([, re]) => re.test(l.entity_type || ''))?.[0] || l.aplicacion || l.modulo || 'Otras acciones'

// Agrupa por tema y junta las acciones iguales del mismo día en una fila.
function agrupar(logs) {
  const temas = new Map()
  for (const l of logs) {
    const tema = temaDe(l)
    if (!temas.has(tema)) temas.set(tema, new Map())
    const filas = temas.get(tema)
    const clave = `${fecha(l.date)}|${l.description}`
    if (!filas.has(clave)) filas.set(clave, { clave, date: l.date, description: l.description, ids: [] })
    filas.get(clave).ids.push(l.id)
  }
  return [...temas].map(([tema, filas]) => {
    const lista = [...filas.values()]
    return { tema, filas: lista, ids: lista.flatMap((f) => f.ids) }
  }).sort((a, b) => b.ids.length - a.ids.length)
}

// Checkbox que muestra estado intermedio cuando solo parte del grupo está elegida.
function Casilla({ ids, elegidos, onCambio, label }) {
  const marcados = ids.filter((id) => elegidos.has(id)).length
  return (
    <input type="checkbox" aria-label={label} checked={marcados === ids.length}
      ref={(el) => { if (el) el.indeterminate = marcados > 0 && marcados < ids.length }}
      onChange={() => onCambio(ids, marcados < ids.length)} />
  )
}

// Lista las acciones propias del mes en Bravo Hub aún no asignadas, agrupadas
// por tema, y las agrega como subactividades nuevas o a una existente.
export default function TraerLogsModal({ actividad, periodo, registros = [], onClose, onAgregado }) {
  const [logs, setLogs] = useState(null)
  const [elegidos, setElegidos] = useState(new Set())
  const [abiertos, setAbiertos] = useState(new Set())
  const [destino, setDestino] = useState(null) // null = automático
  const [titulo, setTitulo] = useState(null) // null = automático
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    getLogsDisponibles(periodo)
      .then(setLogs)
      .catch((e) => { alertError(e.message); setLogs([]) })
  }, [periodo])

  const grupos = useMemo(() => agrupar(logs || []), [logs])
  const gruposElegidos = grupos
    .map((g) => ({ ...g, ids: g.ids.filter((id) => elegidos.has(id)) }))
    .filter((g) => g.ids.length)

  const marcar = (ids, si) => setElegidos((prev) => {
    const s = new Set(prev)
    ids.forEach((id) => (si ? s.add(id) : s.delete(id)))
    return s
  })
  const alternarAbierto = (tema) => setAbiertos((prev) => {
    const s = new Set(prev)
    if (s.has(tema)) s.delete(tema)
    else s.add(tema)
    return s
  })

  const porTema = gruposElegidos.length > 1
  const destinoEf = destino === 'tema' && !porTema ? 'una' : destino ?? (porTema ? 'tema' : 'una')
  const tituloEf = titulo ?? (gruposElegidos.length === 1 ? gruposElegidos[0].tema : 'Acciones en Bravo Hub')

  const agregar = async () => {
    setEnviando(true)
    const base = { actividad_id: actividad.id, ...periodo }
    try {
      if (destinoEf === 'tema') {
        for (const g of gruposElegidos) await createRegistroDesdeLogs({ ...base, titulo: g.tema, log_ids: g.ids })
        toastExito(`${plural(gruposElegidos.length, 'subactividad creada', 'subactividades creadas')}`)
      } else if (destinoEf === 'una') {
        await createRegistroDesdeLogs({ ...base, titulo: tituloEf, log_ids: [...elegidos] })
        toastExito('Subactividad creada')
      } else {
        await createRegistroDesdeLogs({ ...base, registro_id: Number(destinoEf), log_ids: [...elegidos] })
        toastExito('Acciones agregadas a la subactividad')
      }
      onAgregado()
    } catch (e) {
      alertError(e.message)
      onAgregado() // los temas ya creados quedan; recarga para mostrarlos
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box onix-modal-ancho">
        <div className="modal-header">
          <h3>Mis acciones en Bravo Hub — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-form">
          <p className="modal-hint">
            Tus acciones del mes agrupadas por tema. Marca un tema completo o abre el detalle para elegir acciones sueltas
            para "{actividad.nombre}". Las acciones ya asignadas no aparecen.
          </p>

          {logs === null ? (
            <div className="loading-box"><span className="loader"></span>Cargando acciones...</div>
          ) : grupos.length === 0 ? (
            <p className="onix-vacio">No tienes acciones pendientes de asignar en este mes.</p>
          ) : (
            <div className="onix-logs-lista">
              {grupos.map((g) => {
                const abierto = abiertos.has(g.tema)
                const marcados = g.ids.filter((id) => elegidos.has(id)).length
                return (
                  <section key={g.tema} className="onix-logs-grupo">
                    <div className="onix-logs-grupo-head">
                      <label className="onix-logs-grupo-nombre">
                        <Casilla ids={g.ids} elegidos={elegidos} onCambio={marcar} label={`Elegir todo ${g.tema}`} />
                        <strong>{g.tema}</strong>
                        <span className="onix-informe-meta">
                          {plural(g.ids.length, 'acción', 'acciones')}{marcados ? ` · ${marcados} elegidas` : ''}
                        </span>
                      </label>
                      <button type="button" className="onix-agregar-enlace" aria-expanded={abierto} onClick={() => alternarAbierto(g.tema)}>
                        {abierto ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                        {abierto ? 'Ocultar' : 'Ver acciones'}
                      </button>
                    </div>
                    {abierto && (
                      <ul className="onix-logs-filas">
                        {g.filas.map((f) => (
                          <li key={f.clave}>
                            <label>
                              <Casilla ids={f.ids} elegidos={elegidos} onCambio={marcar} label={`Elegir: ${f.description}`} />
                              <span className="onix-informe-meta">{fecha(f.date)}</span>
                              <span>{f.description}</span>
                              {f.ids.length > 1 && <span className="onix-chip">{f.ids.length} veces</span>}
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
                <label htmlFor="logs-destino">¿Dónde agregarlas?</label>
                <select id="logs-destino" className="filter-select" value={destinoEf} onChange={(e) => setDestino(e.target.value)}>
                  {porTema && <option value="tema">Una subactividad nueva por tema ({gruposElegidos.length})</option>}
                  <option value="una">Una sola subactividad nueva</option>
                  {registros.length > 0 && (
                    <optgroup label="Agregar a una subactividad existente">
                      {registros.map((r) => <option key={r.id} value={r.id}>{tituloDe(r)}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              {destinoEf === 'tema' && (
                <p className="onix-informe-meta">
                  Se crearán: {gruposElegidos.map((g) => `${g.tema} (${plural(g.ids.length, 'acción', 'acciones')})`).join(', ')}.
                </p>
              )}
              {destinoEf === 'una' && (
                <div className="modal-field">
                  <label htmlFor="logs-titulo">Título de la subactividad</label>
                  <input id="logs-titulo" value={tituloEf} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={!elegidos.size || enviando || (destinoEf === 'una' && !tituloEf.trim())} onClick={agregar}>
            {enviando ? 'Agregando...' : `Agregar${elegidos.size ? ` ${plural(elegidos.size, 'acción', 'acciones')}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
