import { useId } from 'react'

export default function Sparkline({ data, width = 160, height = 90, color = '#5b73c4' }) {
  const id = useId().replace(/:/g, '')
  const max = Math.max(...data)
  const min = Math.min(...data)
  const stepX = width / (data.length - 1)
  const pts = data.map((v, i) => [
    i * stepX,
    height - 6 - ((v - min) / (max - min || 1)) * (height - 12),
  ])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="hub-chart" role="img" aria-label="Tendencia">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
