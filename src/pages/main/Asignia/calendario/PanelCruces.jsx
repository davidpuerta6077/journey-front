import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { TIPO_CRUCE } from './calendarioUtil'

const describir = (s) => (s ? `${s.codigo} ${s.curso} (G${s.grupo || '—'})` : 'otro curso')

// Resumen de cruces por tipo y lista para saltar a cada uno.
export default function PanelCruces({ cruces, sesionesPorId, onIr }) {
  if (!cruces.length) {
    return <p className="cal-cruces-ok"><CheckCircle2 size={15} aria-hidden="true" /> Sin cruces de horario.</p>
  }
  const conteo = Object.keys(TIPO_CRUCE).map(t => [t, cruces.filter(c => c.tipo === t).length]).filter(([, n]) => n)

  return (
    <section className="cal-cruces" aria-label="Cruces de horario">
      <h3 className="cal-cruces-titulo">
        <AlertTriangle size={16} aria-hidden="true" /> {cruces.length} cruce{cruces.length > 1 ? 's' : ''}
        <span className="cal-cruces-conteo">{conteo.map(([t, n]) => `${n} ${TIPO_CRUCE[t].toLowerCase()}`).join(' · ')}</span>
      </h3>
      <ul className="cal-cruces-lista">
        {cruces.map(c => {
          const [a, b] = c.sesiones.map(id => sesionesPorId.get(id))
          return (
            <li key={c.id}>
              <button type="button" className="cal-cruce-item" onClick={() => onIr(c)}>
                <span className={`badge cal-badge-${c.tipo}`}>{TIPO_CRUCE[c.tipo]}</span>
                <span className="cal-cruce-cuando">{c.dia} {c.inicio}–{c.fin} · {c.etiqueta}</span>
                <span className="cal-cruce-que">{describir(a)} y {describir(b)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
