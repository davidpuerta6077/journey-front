import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Printer } from 'lucide-react'
import { calendarioProfesor } from '../../../../services/asignia/calendarioProfesor'
import CalendarioSemanal from './CalendarioSemanal'
import BarraSemana from './BarraSemana'
import PanelCruces from './PanelCruces'
import ResumenCarga from './ResumenCarga'
import DetalleSesionModal from './DetalleSesionModal'
import {
  semanasDelSemestre, lunesDe, hoyBogota, diaSemana, sumarDias, diasSinClase, diasMarcados, crucesPorSesion, rangoSemana,
} from './calendarioUtil'
import '../../../../styles/main/Asignia/AsigniaCalendario.css'

// Horario del profesor (enlace público, solo lectura): sus cursos asignados y
// aceptados, y punteadas sus postulaciones en revisión. El back solo devuelve
// sus datos y sus cruces de profesor.
export default function MiHorario({ ident, nombre }) {
  const hoy = hoyBogota()
  const [resp, setResp] = useState({ clave: null, data: null, error: '' })
  const clave = `${ident.documento}|${ident.correo}`
  const [lunes, setLunes] = useState(null)
  const [modo, setModo] = useState(() => (window.matchMedia('(max-width: 768px)').matches ? 'dia' : 'semana'))
  const [diaNum, setDiaNum] = useState(() => Math.min(diaSemana(hoy), 6))
  const [enfocado, setEnfocado] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const refs = useRef(new Map())
  const registrar = useCallback((id, el) => { if (el) refs.current.set(id, el); else refs.current.delete(id) }, [])

  useEffect(() => {
    calendarioProfesor(ident)
      .then(data => setResp({ clave, data, error: '' }))
      .catch(e => setResp({ clave, data: false, error: e.message }))
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = enfocado && refs.current.get(enfocado)
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }) }
  }, [enfocado, lunes, diaNum, modo])

  const data = resp.clave === clave ? resp.data : null
  const sesionesPorId = useMemo(() => new Map((data?.sesiones || []).map(s => [s.id, s])), [data])
  const porSesion = useMemo(() => crucesPorSesion(data?.cruces), [data])
  const semanas = useMemo(() => semanasDelSemestre(data?.semestre), [data])
  const sinClase = useMemo(() => diasSinClase(data?.noLaborables, data?.semanas), [data])
  const marcados = useMemo(() => diasMarcados(data?.semanas), [data])
  const lunesActual = lunes && semanas.includes(lunes) ? lunes : (semanas.includes(lunesDe(hoy)) ? lunesDe(hoy) : semanas[0] || null)

  if (data === null) return <div className="loading-box"><span className="loader"></span>Cargando tu horario...</div>
  if (data === false) return <div className="public-form-error" role="alert">{resp.error}</div>

  const irACruce = (c) => {
    setDiaNum(c.diaNum)
    if (semanas.length) {
      const i0 = Math.max(semanas.indexOf(lunesActual), 0)
      const orden = [...semanas.slice(i0), ...semanas.slice(0, i0)]
      setLunes(orden.find(l => !sinClase[sumarDias(l, c.diaNum - 1)]) || lunesActual)
    }
    setEnfocado(c.sesiones[0])
  }
  const tentativas = data.sesiones.filter(s => s.tentativa).length

  return (
    <div className="cal-pagina cal-imprimible">
      <div className="cal-impresion-titulo">
        <h2>Horario de {nombre || ident.correo}</h2>
        <p>Programación académica {data.periodo}{lunesActual ? ` · Semana del ${rangoSemana(lunesActual)}` : ' · Semana tipo'}</p>
      </div>
      <div className="asignia-barra cal-no-imprimir">
        <p className="asignia-ayuda">
          Tus clases asignadas y aceptadas.{tentativas ? ` Las ${tentativas} sesiones con borde punteado son postulaciones en revisión.` : ''}
          {!data.semestre ? ' Aún no están configuradas las fechas del semestre: ves la semana tipo.' : ''}
        </p>
        <button type="button" className="btn-secondary" onClick={() => window.print()}><Printer size={15} /> Imprimir horario</button>
      </div>
      <ResumenCarga carga={data.carga} semestre={data.semestre} />
      <PanelCruces cruces={data.cruces} sesionesPorId={sesionesPorId} onIr={irACruce} />
      <div className="cal-no-imprimir">
        <BarraSemana semanas={semanas} lunes={lunesActual} onLunes={setLunes} hoy={hoy}
          modo={modo} onModo={setModo} diaNum={diaNum} onDia={setDiaNum} />
      </div>
      <CalendarioSemanal sesiones={data.sesiones} cruces={data.cruces} lunes={lunesActual} hoy={hoy}
        sinClase={sinClase} marcados={marcados}
        horaInicio={data.semestre?.hora_inicio} horaFin={data.semestre?.hora_fin}
        modo={modo} diaNum={diaNum} enfocado={enfocado} onSelect={setDetalle} registrar={registrar} />
      {detalle && <DetalleSesionModal s={detalle} cruces={porSesion.get(detalle.id)} sesionesPorId={sesionesPorId} onClose={() => setDetalle(null)} />}
    </div>
  )
}
