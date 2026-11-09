import { useMemo } from 'react'
import BloqueSesion from './BloqueSesion'
import { DIAS_CAL, sumarDias, minutos, hhmm, carriles, colorDe, crucesPorSesion } from './calendarioUtil'
import { ESTADOS, TONOS } from '../asigniaUtil'

const ALTO_30 = 22 // px por franja de 30 minutos

// Estado de una sesión: la postulación pendiente del profesor va "En revisión".
const tonoDe = (s) => (s.tentativa ? TONOS.revision : ESTADOS[s.verificacion] || TONOS.disponible)

// Cuadrícula semanal (lunes a sábado) o de un solo día. Las clases se repiten
// cada semana; con `lunes` se muestran fechas, festivos y semanas sin clase.
export default function CalendarioSemanal({
  sesiones, cruces = [], lunes = null, hoy, sinClase = {}, marcados = {},
  horaInicio = '06:00', horaFin = '22:00', colorPor = 'estado',
  modo = 'semana', diaNum = 1, enfocado, onSelect, registrar,
}) {
  const porSesion = useMemo(() => crucesPorSesion(cruces), [cruces])

  // La jornada se amplía si alguna clase queda por fuera de la configurada.
  const [ini, fin] = useMemo(() => {
    let a = minutos(horaInicio)
    let b = minutos(horaFin)
    for (const s of sesiones) { a = Math.min(a, s.inicioMin); b = Math.max(b, s.finMin) }
    return [Math.floor(a / 60) * 60, Math.ceil(b / 60) * 60]
  }, [sesiones, horaInicio, horaFin])

  const dias = (modo === 'dia' ? DIAS_CAL.filter(d => d.num === diaNum) : DIAS_CAL).map(d => {
    const fecha = lunes ? sumarDias(lunes, d.num - 1) : null
    return { ...d, fecha, sinClase: fecha ? sinClase[fecha] : null, marcado: fecha ? marcados[fecha] : null }
  })

  const porDia = useMemo(() => {
    const m = new Map()
    for (const s of sesiones) {
      if (!m.has(s.diaNum)) m.set(s.diaNum, [])
      m.get(s.diaNum).push(s)
    }
    return m
  }, [sesiones])

  const horas = []
  for (let m = ini; m < fin; m += 60) horas.push(m)
  const alto = ((fin - ini) / 30) * ALTO_30
  const y = (min) => ((min - ini) / 30) * ALTO_30

  const leyenda = colorPor === 'estado' ? [...new Set(sesiones.map(s => tonoDe(s)))] : []

  return (
    <>
    {leyenda.length > 0 && (
      <ul className="cal-leyenda" aria-label="Colores por estado">
        {leyenda.map(t => <li key={t.label}><span className={`cal-leyenda-muestra ${t.cal}`} aria-hidden="true" />{t.label}</li>)}
      </ul>
    )}
    <div className={`cal cal-${modo}`} style={{ '--cal-cols': dias.length }}>
      <div className="cal-cabecera">
        <div className="cal-esquina" aria-hidden="true" />
        {dias.map(d => (
          <div key={d.num} className={`cal-dia-head${d.fecha && d.fecha === hoy ? ' cal-hoy' : ''}${d.sinClase ? ' cal-dia-head-sin-clase' : ''}`}>
            <span className="cal-dia-nombre">{modo === 'dia' ? d.nombre : d.corto}</span>
            {d.fecha && <span className="cal-dia-num">{Number(d.fecha.slice(8))}</span>}
            {d.fecha === hoy && <span className="sr-only">(hoy)</span>}
            {d.marcado && <span className="cal-marcado">{d.marcado}</span>}
          </div>
        ))}
      </div>

      <div className="cal-cuerpo">
        <div className="cal-horas" style={{ height: alto }} aria-hidden="true">
          {horas.map(m => <span key={m} className="cal-hora" style={{ top: y(m) }}>{hhmm(m)}</span>)}
        </div>
        {dias.map(d => {
          const lista = porDia.get(d.num) || []
          if (d.sinClase) {
            return (
              <div key={d.num} className="cal-col cal-col-sin-clase" style={{ height: alto }}>
                <div className="cal-sin-clase-texto">
                  <strong>{d.sinClase.tipo === 'festivo' ? 'Festivo' : d.sinClase.tipo === 'semana' ? 'Sin clase' : 'No laborable'}</strong>
                  <span>{d.sinClase.nombre}</span>
                  {lista.length > 0 && <span className="cal-sin-clase-n">{lista.length} clase{lista.length > 1 ? 's' : ''} no se dicta{lista.length > 1 ? 'n' : ''}</span>}
                </div>
              </div>
            )
          }
          const lanes = carriles(lista)
          return (
            <div key={d.num} className="cal-col" style={{ height: alto }} role="group" aria-label={`${d.nombre}${d.fecha ? ` ${d.fecha}` : ''}: ${lista.length} clase${lista.length !== 1 ? 's' : ''}`}>
              {lista.map(s => {
                const { carril, carriles: n } = lanes.get(s.id)
                return (
                  <BloqueSesion key={s.id} s={s} registrar={registrar}
                    color={colorPor === 'estado' ? tonoDe(s).cal : `cal-c-${colorDe(colorPor === 'profesor' ? s.profesor_documento || s.profesor_nombre : s.codigo)}`}
                    estado={tonoDe(s).label} verEstado={colorPor === 'estado'}
                    cruces={porSesion.get(s.id)} enfocado={enfocado === s.id} onClick={onSelect}
                    style={{
                      top: y(s.inicioMin) + 1,
                      height: Math.max(y(s.finMin) - y(s.inicioMin) - 2, 18),
                      left: `calc(${(carril / n) * 100}% + 2px)`,
                      width: `calc(${100 / n}% - 4px)`,
                    }} />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}
