import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { INK, GRID, colorForEstado } from './palette'

// Donut para composición (pocas categorías). `nameKey`/`valueKey` sobre `data`.
// Usa colores de estado cuando los nombres son estados conocidos.
// `onSelect(nombre)`: clic en una porción -> su nameKey (drill-down).
export default function DonutChartCard({ title, data = [], nameKey, valueKey, height = 320, onSelect }) {
  const total = data.reduce((a, d) => a + (Number(d[valueKey]) || 0), 0)

  return (
    <figure className="chart-card">
      {title && <figcaption className="chart-card-title">{title}{onSelect && <span className="chart-card-hint"> · clic para ver el detalle</span>}</figcaption>}
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              label={(e) => `${e[nameKey]}: ${e[valueKey]}`}
              labelLine={false}
              cursor={onSelect ? 'pointer' : undefined}
              onClick={onSelect ? (d) => onSelect(d?.payload?.[nameKey] ?? d?.[nameKey]) : undefined}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={colorForEstado(d[nameKey], i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]}
              contentStyle={{ fontSize: 13, borderRadius: 8, border: `1px solid ${GRID}` }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-card-foot" style={{ color: INK.muted }}>Total: {total.toLocaleString('es-CO')}</figcaption>
    </figure>
  )
}
