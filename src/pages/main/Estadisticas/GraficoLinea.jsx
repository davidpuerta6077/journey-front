import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { CATEGORICAL } from '../../../components/charts/palette'
import useTemaOscuro from './temaOscuro'

const fechaCorta = (dia) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

function Ayuda({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="inf-tooltip">
      <strong>{fechaCorta(label)}</strong>
      {payload.map((p) => (
        <span key={p.dataKey}><i className="est-dot" style={{ background: p.color }} /> {p.name}: {p.value.toLocaleString('es-CO')}</span>
      ))}
    </div>
  )
}

// Líneas por día (áreas suaves). dias = ['YYYY-MM-DD', ...]; series = [{ nombre, valores }].
export default function GraficoLinea({ dias, series: seriesApi }) {
  // De mayor a menor total: mismo orden (y colores) que la dona de categorías.
  const series = [...seriesApi].sort((a, b) => b.valores.reduce((x, y) => x + y, 0) - a.valores.reduce((x, y) => x + y, 0))
  const oscuro = useTemaOscuro()
  const tinta = oscuro ? '#cbd5e1' : '#6b7694'
  const grilla = oscuro ? '#334155' : '#e3e7f3'
  const data = dias.map((dia, i) => Object.fromEntries([['dia', dia], ...series.map((s) => [s.nombre, s.valores[i]])]))
  const totales = series.map((s) => s.valores.reduce((a, b) => a + b, 0))

  return (
    <>
      <div className="est-linea">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.nombre} id={`est-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORICAL[i % CATEGORICAL.length]} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CATEGORICAL[i % CATEGORICAL.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={grilla} strokeDasharray="3 4" />
            <XAxis dataKey="dia" tickFormatter={fechaCorta} tick={{ fill: tinta, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fill: tinta, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString('es-CO')} width={56} />
            <Tooltip content={<Ayuda />} />
            {series.map((s, i) => (
              <Area key={s.nombre} type="monotone" dataKey={s.nombre} name={s.nombre} stroke={CATEGORICAL[i % CATEGORICAL.length]}
                strokeWidth={2} fill={`url(#est-grad-${i})`} dot={false} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="est-linea-leyenda">
        {series.map((s, i) => (
          <li key={s.nombre}>
            <i className="est-dot" style={{ background: CATEGORICAL[i % CATEGORICAL.length] }} />
            <span>{s.nombre}</span>
            <strong>{totales[i].toLocaleString('es-CO')}</strong>
          </li>
        ))}
      </ul>
    </>
  )
}
