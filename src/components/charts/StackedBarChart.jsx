import Legend from './Legend'

export default function StackedBarChart({ data, series, yMax = 100, yStep = 20 }) {
  const W = 300, H = 200
  const pad = { l: 30, r: 6, t: 8, b: 22 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const slot = innerW / data.length
  const barW = slot * 0.5
  const y = (v) => pad.t + (1 - v / yMax) * innerH

  const ticks = []
  for (let t = 0; t <= yMax; t += yStep) ticks.push(t)

  return (
    <div className="hub-stacked">
      <svg viewBox={`0 0 ${W} ${H}`} className="hub-chart" role="img" aria-label="Barras apiladas">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e3e7f3" />
            <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#6b7694">{t}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const bx = pad.l + i * slot + (slot - barW) / 2
          let acc = 0
          return (
            <g key={d.label}>
              {series.map((s) => {
                const v = d[s.key]
                const rect = (
                  <rect key={s.key} x={bx} y={y(acc + v)} width={barW} height={y(acc) - y(acc + v)} fill={s.color} />
                )
                acc += v
                return rect
              })}
              <text x={bx + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7694">{d.label}</text>
            </g>
          )
        })}
      </svg>
      <Legend items={series} />
    </div>
  )
}
