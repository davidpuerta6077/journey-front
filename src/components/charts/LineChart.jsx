import { useId } from 'react'

export default function LineChart({
  data,
  yMax = 250,
  yStep = 50,
  highlightIndex,
  highlightText,
  color = '#5b73c4',
}) {
  const id = useId().replace(/:/g, '')
  const W = 800, H = 240
  const pad = { l: 40, r: 16, t: 16, b: 28 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const x = (i) => pad.l + (i * innerW) / (data.length - 1)
  const y = (v) => pad.t + (1 - v / yMax) * innerH

  const ticks = []
  for (let t = 0; t <= yMax; t += yStep) ticks.push(t)

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const hl = highlightIndex != null ? data[highlightIndex] : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hub-chart" role="img" aria-label="Gráfico de líneas">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e3e7f3" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b7694">{t}</text>
        </g>
      ))}

      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />

      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill={color} />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7694">{d.label}</text>
        </g>
      ))}

      {hl && (
        <g>
          <rect x={x(highlightIndex) - 38} y={y(hl.value) - 40} width="76" height="24" rx="4" fill={color} />
          <text x={x(highlightIndex)} y={y(hl.value) - 24} textAnchor="middle" fontSize="11" fill="#fff">
            {highlightText}
          </text>
        </g>
      )}
    </svg>
  )
}
