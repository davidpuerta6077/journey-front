import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { CATEGORICAL, INK, GRID } from './palette'

// Línea para series temporales. `series`: [{ key, label }].
export default function LineChartCard({ title, data = [], xKey, series = [], height = 320 }) {
  const multi = series.length > 1
  const axisTick = { fill: INK.secondary, fontSize: 12 }

  return (
    <figure className="chart-card">
      {title && <figcaption className="chart-card-title">{title}</figcaption>}
      <div className="chart-card-body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey={xKey} tick={axisTick} stroke={GRID} />
            <YAxis tick={axisTick} stroke={GRID} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: `1px solid ${GRID}` }}
              labelStyle={{ color: INK.primary }}
            />
            {multi && <Legend wrapperStyle={{ fontSize: 12, color: INK.secondary }} />}
            {series.map((s, si) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label || s.key}
                stroke={CATEGORICAL[si]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
