export default function MiniBars({
  data,
  max = Math.max(...data),
  color = '#5b73c4',
  track = '#dfe4f4',
}) {
  const barW = 10
  const gap = 5
  const h = 100
  const w = data.length * (barW + gap) - gap

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="hub-chart" role="img" aria-label="Barras">
      {data.map((v, i) => {
        const x = i * (barW + gap)
        const bh = (v / max) * h
        return (
          <g key={i}>
            <rect x={x} y={0} width={barW} height={h} rx="2" fill={track} />
            <rect x={x} y={h - bh} width={barW} height={bh} rx="2" fill={color} />
          </g>
        )
      })}
    </svg>
  )
}
