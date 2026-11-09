import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, Printer } from 'lucide-react'
import { obtenerCalendario } from '../../../services/asignia/obtenerCalendario'
import CalendarioSemanal from './calendario/CalendarioSemanal'
import BarraSemana from './calendario/BarraSemana'
import PanelCruces from './calendario/PanelCruces'
import ResumenCarga from './calendario/ResumenCarga'
import DetalleSesionModal from './calendario/DetalleSesionModal'
import {
  semanasDelSemestre, lunesDe, hoyBogota, diaSemana, sumarDias, diasSinClase, diasMarcados, crucesPorSesion, rangoSemana,
} from './calendario/calendarioUtil'
import { DIAS_SEMANA, FRANJAS, franjaDe, horasDistintas } from './asigniaUtil'
import '../../../styles/main/Asignia/AsigniaCalendario.css'

const SIN_FILTROS = { profesor: '', programa: '', asignatura: '', aula: '', modalidad: '', dia: '', franja: '', horas: '' }
const opciones = (lista, valor, etiqueta = valor) => {
  const m = new Map()
  for (const s of lista) { const v = valor(s); if (v && !m.has(v)) m.set(v, etiqueta(s)) }
  return [...m].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'es', { numeric: true }))
}

// Pestaña "Calendario" del líder: todas las clases con filtros y cruces. Al filtrar
// por un profesor se muestran además su carga del semestre y el botón de imprimir.
export default function AsigniaCalendario({ periodo }) {
  const hoy = hoyBogota()
  // Respuestas guardadas con la clave de la consulta: si la clave no coincide, está cargando.
  const [respGeneral, setRespGeneral] = useState({ clave: null, data: null })
  const [respProfesor, setRespProfesor] = useState({ clave: null, data: null })
  const [error, setError] = useState('')
  const [f, setF] = useState(SIN_FILTROS)
  const [colorPor, setColorPor] = useState('estado')
  const [lunes, setLunes] = useState(null)
  const [modo, setModo] = useState(() => (window.matchMedia('(max-width: 768px)').matches ? 'dia' : 'semana'))
  const [diaNum, setDiaNum] = useState(() => Math.min(diaSemana(hoy), 6))
  const [enfocado, setEnfocado] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const refs = useRef(new Map())
  const registrar = useCallback((id, el) => { if (el) refs.current.set(id, el); else refs.current.delete(id) }, [])

  useEffect(() => {
    obtenerCalendario({ periodo })
      .then(data => setRespGeneral({ clave: periodo, data }))
      .catch(e => { setError(e.message); setRespGeneral({ clave: periodo, data: false }) })
  }, [periodo])

  const documento = f.profesor
  const claveProfesor = documento ? `${periodo}|${documento}` : null
  useEffect(() => {
    if (!claveProfesor) return
    obtenerCalendario({ periodo, documento })
      .then(data => setRespProfesor({ clave: claveProfesor, data }))
      .catch(e => setError(e.message))
  }, [claveProfesor, periodo, documento])

  const general = respGeneral.clave === periodo ? respGeneral.data : null
  const deProfesor = claveProfesor && respProfesor.clave === claveProfesor ? respProfesor.data : null

  // Al enfocar un bloque (desde el panel de cruces) se lleva a la vista y recibe el foco.
  useEffect(() => {
    const el = enfocado && refs.current.get(enfocado)
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }) }
  }, [enfocado, lunes, diaNum, modo])

  const data = general
  const profesores = useMemo(() => opciones(general?.sesiones || [], s => s.profesor_documento, s => s.profesor_nombre || s.profesor_documento), [general])

  const sesiones = useMemo(() => {
    if (!data) return []
    return data.sesiones.filter(s => (!f.profesor || s.profesor_documento === f.profesor)
      && (!f.programa || s.programa === f.programa)
      && (!f.asignatura || s.codigo === f.asignatura)
      && (!f.aula || s.aula === f.aula)
      && (!f.modalidad || s.modalidad === f.modalidad)
      && (!f.dia || s.dia === f.dia)
      && (!f.franja || franjaDe(s.inicio) === f.franja)
      && (!f.horas || String(s.horas_semana) === f.horas))
  }, [data, f])

  const visibles = useMemo(() => new Set(sesiones.map(s => s.id)), [sesiones])
  const cruces = useMemo(() => (data?.cruces || []).filter(c => c.sesiones.some(id => visibles.has(id))), [data, visibles])
  const sesionesPorId = useMemo(() => new Map([...(data?.sesiones || []), ...(data?.sesionesRelacionadas || [])].map(s => [s.id, s])), [data])
  const porSesion = useMemo(() => crucesPorSesion(cruces), [cruces])

  const semanas = useMemo(() => semanasDelSemestre(data?.semestre), [data])
  const sinClase = useMemo(() => diasSinClase(data?.noLaborables, data?.semanas), [data])
  const marcados = useMemo(() => diasMarcados(data?.semanas), [data])
  const lunesActual = lunes && semanas.includes(lunes) ? lunes : (semanas.includes(lunesDe(hoy)) ? lunesDe(hoy) : semanas[0] || null)

  // Salta a la primera semana (desde la actual) en que ese día sí tiene clase.
  const irACruce = (c) => {
    setDiaNum(c.diaNum)
    if (semanas.length) {
      const i0 = Math.max(semanas.indexOf(lunesActual), 0)
      const orden = [...semanas.slice(i0), ...semanas.slice(0, i0)]
      setLunes(orden.find(l => !sinClase[sumarDias(l, c.diaNum - 1)]) || lunesActual)
    }
    setEnfocado(c.sesiones.find(id => visibles.has(id)) || c.sesiones[0])
  }

  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const domingo = sesiones.filter(s => s.diaNum === 7)

  if (general === null) return <div className="loading-box"><span className="loader"></span>Cargando calendario...</div>
  if (general === false) return <div className="public-form-error" role="alert">{error}</div>

  return (
    <div className="cal-pagina">
      <div className="cal-herramientas">
          <div className="cal-filtros">
            <select className="filter-select" value={f.profesor} onChange={(e) => { set('profesor')(e); setEnfocado(null) }} aria-label="Profesor">
              <option value="">Todos los profesores</option>
              {profesores.map(([doc, nombre]) => <option key={doc} value={doc}>{nombre}</option>)}
            </select>
            <select className="filter-select" value={f.programa} onChange={set('programa')} aria-label="Programa">
              <option value="">Todos los programas</option>
              {opciones(general.sesiones, s => s.programa).map(([v]) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select className="filter-select" value={f.asignatura} onChange={set('asignatura')} aria-label="Asignatura">
              <option value="">Todas las asignaturas</option>
              {opciones(general.sesiones, s => s.codigo, s => `${s.codigo} · ${s.curso}`).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <select className="filter-select" value={f.aula} onChange={set('aula')} aria-label="Aula">
              <option value="">Todas las aulas</option>
              {opciones(general.sesiones, s => s.aula).map(([v]) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select className="filter-select" value={f.modalidad} onChange={set('modalidad')} aria-label="Modalidad">
              <option value="">Toda modalidad</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
            </select>
            <select className="filter-select" value={f.dia} onChange={set('dia')} aria-label="Día de la semana">
              <option value="">Todos los días</option>
              {DIAS_SEMANA.slice(0, 6).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={f.franja} onChange={set('franja')} aria-label="Horario">
              <option value="">Todo el horario</option>
              {FRANJAS.map(fr => <option key={fr.v} value={fr.v}>{fr.label}</option>)}
            </select>
            <select className="filter-select" value={f.horas} onChange={set('horas')} aria-label="Horas por semana">
              <option value="">Todas las horas</option>
              {horasDistintas(general.sesiones).map(h => <option key={h} value={h}>{h} h/semana</option>)}
            </select>
            {Object.values(f).some(Boolean) && <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => setF(SIN_FILTROS)}><X size={14} /> Limpiar</button>}
          </div>
        <label className="cal-color-por">
          Color por
          <select className="filter-select" value={colorPor} onChange={(e) => setColorPor(e.target.value)}>
            <option value="estado">Estado</option>
            <option value="asignatura">Asignatura</option>
            <option value="profesor">Profesor</option>
          </select>
        </label>
      </div>

      {error && general && <div className="public-form-error" role="alert">{error}</div>}
      {!general.semestre && (
        <p className="asignia-aviso">El semestre {general.periodo} no tiene fechas configuradas: se muestra la semana tipo, sin fechas ni festivos.</p>
      )}
      {data?.invalidas?.length > 0 && (
        <p className="asignia-aviso">{data.invalidas.length} franja(s) con horario ilegible no se dibujan: {data.invalidas.slice(0, 5).map(i => `${i.codigo} G${i.grupo} (${i.dia || '?'} "${i.hora || ''}")`).join(', ')}{data.invalidas.length > 5 ? '…' : ''}</p>
      )}
      {domingo.length > 0 && <p className="asignia-aviso">{domingo.length} clase(s) programada(s) el domingo no se muestran en el calendario.</p>}

      {!data ? (
        <div className="loading-box"><span className="loader"></span>Cargando horario...</div>
      ) : (
        <div className={`cal-pagina${documento ? ' cal-imprimible' : ''}`}>
          {documento && (
            <>
              <div className="cal-impresion-titulo">
                <h2>Horario de {profesores.find(([d]) => d === documento)?.[1] || documento}</h2>
                <p>Programación académica {data.periodo}{lunesActual ? ` · Semana del ${rangoSemana(lunesActual)}` : ' · Semana tipo'}</p>
              </div>
              <div className="cal-barra cal-no-imprimir">
                <span />
                <button type="button" className="btn-secondary" onClick={() => window.print()}><Printer size={15} /> Imprimir horario</button>
              </div>
              {deProfesor ? <ResumenCarga carga={deProfesor.carga} semestre={data.semestre} />
                : <div className="loading-box"><span className="loader"></span>Calculando la carga del profesor...</div>}
            </>
          )}
          <PanelCruces cruces={cruces} sesionesPorId={sesionesPorId} onIr={irACruce} />
          <div className="cal-no-imprimir">
            <BarraSemana semanas={semanas} lunes={lunesActual} onLunes={setLunes} hoy={hoy}
              modo={modo} onModo={setModo} diaNum={diaNum} onDia={setDiaNum} />
          </div>
          <CalendarioSemanal sesiones={sesiones} cruces={cruces} lunes={lunesActual} hoy={hoy}
            sinClase={sinClase} marcados={marcados}
            horaInicio={data.semestre?.hora_inicio} horaFin={data.semestre?.hora_fin}
            colorPor={colorPor} modo={modo} diaNum={diaNum} enfocado={enfocado}
            onSelect={setDetalle} registrar={registrar} />
        </div>
      )}

      {detalle && (
        <DetalleSesionModal s={detalle} cruces={porSesion.get(detalle.id)} sesionesPorId={sesionesPorId} onClose={() => setDetalle(null)} />
      )}
    </div>
  )
}
