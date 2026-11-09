import { AlertTriangle } from 'lucide-react'

// Tarjeta de una clase en el calendario. `color` es la clase de color (cal-c-N por
// asignatura/profesor, o cal-e-* por estado) y `estado` el texto del estado. Un cruce se indica con borde rojo,
// ícono y el texto "Cruce" (no solo con color).
export default function BloqueSesion({ s, color, estado, verEstado, cruces, style, enfocado, onClick, registrar }) {
  const enCruce = cruces?.length > 0
  const etiqueta = [
    `${s.codigo} ${s.curso}, grupo ${s.grupo || '—'}`,
    `${s.dia} ${s.inicio} a ${s.fin}`,
    s.aula ? `aula ${s.aula}` : s.modalidad,
    s.profesor_nombre,
    estado,
    enCruce ? `${cruces.length} cruce${cruces.length > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      ref={(el) => registrar?.(s.id, el)}
      className={`cal-bloque ${color}${enCruce ? ' cal-bloque-cruce' : ''}${s.tentativa ? ' cal-bloque-tentativa' : ''}${enfocado ? ' cal-bloque-enfocado' : ''}`}
      style={style}
      onClick={() => onClick?.(s)}
      aria-label={etiqueta}
      title={etiqueta}
    >
      {enCruce && <span className="cal-bloque-alerta"><AlertTriangle size={12} aria-hidden="true" /> Cruce</span>}
      {verEstado && <span className="cal-bloque-estado">{estado}</span>}
      <strong className="cal-bloque-titulo">{s.curso}</strong>
      <span className="cal-bloque-dato">{s.codigo} · G{s.grupo || '—'}</span>
      <span className="cal-bloque-dato">{s.aula || s.modalidad} · {s.inicio}–{s.fin}</span>
    </button>
  )
}
