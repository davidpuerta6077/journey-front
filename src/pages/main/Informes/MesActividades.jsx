import { ChevronRight } from 'lucide-react'
import { generada, plural } from './evidencias'

// Primera vista del mes: las actividades del contrato, cada una con su avance.
// Al elegir una se entra a ella (ActividadMes).
export default function MesActividades({ actividades, porActividad, onAbrir }) {
  return (
    <ol className="onix-actividades">
      {actividades.map((a, i) => {
        const regs = porActividad[a.id] || []
        const listas = regs.filter(generada).length
        const completa = regs.length > 0 && listas === regs.length
        const estado = !regs.length
          ? 'Sin registros este mes'
          : completa
            ? `Lista: ${plural(regs.length, 'cosa redactada', 'cosas redactadas')}`
            : `${listas} de ${regs.length} redactadas`
        return (
          <li key={a.id}>
            <button type="button" className="onix-actividad-fila" onClick={() => onAbrir(a.id)}>
              <span className="onix-act-num" aria-hidden="true">{i + 1}</span>
              <span className="onix-actividad-info">
                <span className="onix-actividad-nombre">{a.nombre}</span>
                {a.descripcion && <span className="onix-actividad-desc">{a.descripcion}</span>}
              </span>
              <span className="onix-actividad-avance">
                <span className={`onix-actividad-estado${completa ? ' ok' : !regs.length ? ' vacio' : ''}`}>{estado}</span>
                <span className="onix-barra" aria-hidden="true">
                  <span style={{ width: `${regs.length ? (listas / regs.length) * 100 : 0}%` }} />
                </span>
              </span>
              <ChevronRight size={20} aria-hidden="true" className="onix-fila-flecha" />
            </button>
          </li>
        )
      })}
    </ol>
  )
}
