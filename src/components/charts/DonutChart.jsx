import Legend from './Legend'

export default function DonutChart({ segments, centerLabel = 'Total' }) {
  const r = 42
  const C = 2 * Math.PI * r
  const total = segments.reduce((s, d) => s + d.value, 0)
  let acc = 0

  return (
    <div className="hub-donut">
      <svg viewBox="0 0 120 120" className="hub-donut-svg" role="img" aria-label="Gráfico de dona">
        <g transform="rotate(-90 60 60)">
          {segments.map((s) => {
            const len = (s.value / total) * C
            const el = (
              <circle
                key={s.label}
                cx="60" cy="60" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
              />
            )
            acc += len
            return el
          })}
        </g>
        <text x="60" y="62" textAnchor="middle" fontSize="20" fontWeight="700" fill="#2c3a6b">{total}</text>
        <text x="60" y="76" textAnchor="middle" fontSize="9" fill="#6b7694">{centerLabel}</text>
      </svg>
      <Legend items={segments} />
    </div>
  )
}
