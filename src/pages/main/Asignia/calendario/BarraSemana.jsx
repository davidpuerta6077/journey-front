import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DIAS_CAL, rangoSemana, lunesDe } from './calendarioUtil'

// Navegación por semanas del semestre + selector Día/Semana.
export default function BarraSemana({ semanas, lunes, onLunes, hoy, modo, onModo, diaNum, onDia }) {
  const i = semanas.indexOf(lunes)
  const lunesHoy = lunesDe(hoy)
  const hoyEnSemestre = semanas.includes(lunesHoy)

  return (
    <div className="cal-barra">
      {semanas.length > 0 ? (
        <div className="cal-barra-semana">
          <button type="button" className="btn-icon cal-flecha" onClick={() => onLunes(semanas[i - 1])} disabled={i <= 0} aria-label="Semana anterior"><ChevronLeft size={16} /></button>
          <button type="button" className="btn-icon cal-flecha" onClick={() => onLunes(semanas[i + 1])} disabled={i < 0 || i >= semanas.length - 1} aria-label="Semana siguiente"><ChevronRight size={16} /></button>
          <button type="button" className="btn-secondary" onClick={() => onLunes(lunesHoy)} disabled={!hoyEnSemestre || lunes === lunesHoy}
            title={hoyEnSemestre ? '' : 'Hoy está fuera del semestre'}>Hoy</button>
          <h3 className="cal-rango">{rangoSemana(lunes)}</h3>
          <select className="filter-select cal-select-semana" value={lunes} onChange={(e) => onLunes(e.target.value)} aria-label="Semana del semestre">
            {semanas.map((l, n) => <option key={l} value={l}>Semana {n + 1} · {rangoSemana(l)}</option>)}
          </select>
        </div>
      ) : (
        <h3 className="cal-rango">Semana tipo</h3>
      )}
      <div className="cal-barra-modo">
        {modo === 'dia' && (
          <select className="filter-select" value={diaNum} onChange={(e) => onDia(Number(e.target.value))} aria-label="Día">
            {DIAS_CAL.map(d => <option key={d.num} value={d.num}>{d.nombre}</option>)}
          </select>
        )}
        <div className="cal-segmentado" role="group" aria-label="Vista">
          <button type="button" className={modo === 'dia' ? 'activo' : ''} aria-pressed={modo === 'dia'} onClick={() => onModo('dia')}>Día</button>
          <button type="button" className={modo === 'semana' ? 'activo' : ''} aria-pressed={modo === 'semana'} onClick={() => onModo('semana')}>Semana</button>
        </div>
      </div>
    </div>
  )
}
