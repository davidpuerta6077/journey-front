import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'
import { CATEGORICAL, INK, GRID, colorForEstado } from './palette'
import '../../styles/components/charts.css'

// Barras. `series`: [{ key, label }] (>=2 -> apiladas si stacked, con leyenda).
// `orientation`: 'y' = barras horizontales (bueno para listas de categorías con
// nombres largos); 'x' = verticales.
// `onSelect(valor)`: clic en una barra -> valor de xKey de esa barra (drill-down).
export default function BarChartCard({
  title, data = [], xKey, series = [], stacked = false, orientation = 'x', colorByEstado = false, height = 320, onSelect,
}) {
  const multi = series.length > 1
  const horizontal = orientation === 'y'
  const axisTick = { fill: INK.secondary, fontSize: 12 }

  return (
    <figure className="chart-card">
      {title && <figcaption className="chart-card-title">{title}{onSelect && <span className="chart-card-hint"> · clic para ver el detalle</span>}</figcaption>}
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 8, right: 16, bottom: 8, left: horizontal ? 8 : 0 }}
            barCategoryGap={horizontal ? '22%' : '28%'}
          >
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={!horizontal} horizontal={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" tick={axisTick} stroke={GRID} />
                <YAxis type="category" dataKey={xKey} tick={axisTick} stroke={GRID} width={150} interval={0} />
              </>
            ) : (
              <>
                <XAxis dataKey={xKey} tick={axisTick} stroke={GRID} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 60 : 30} />
                <YAxis tick={axisTick} stroke={GRID} />
              </>
            )}
            <Tooltip
              cursor={{ fill: 'rgba(74,112,224,0.08)' }}
              contentStyle={{ fontSize: 13, borderRadius: 8, border: `1px solid ${GRID}` }}
              labelStyle={{ color: INK.primary }}
            />
            {multi && <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary }} />}
            {series.map((s, si) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label || s.key}
                stackId={stacked ? 'a' : undefined}
                fill={CATEGORICAL[si]}
                radius={stacked ? 0 : (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0])}
                maxBarSize={horizontal ? 22 : 48}
                cursor={onSelect ? 'pointer' : undefined}
                onClick={onSelect ? (d) => onSelect(d?.payload?.[xKey] ?? d?.[xKey]) : undefined}
              >
                {!multi && colorByEstado && data.map((d, di) => (
                  <Cell key={di} fill={colorForEstado(d[xKey], di)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
