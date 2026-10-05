export default function Legend({ items }) {
  return (
    <ul className="hub-legend">
      {items.map((it) => (
        <li key={it.label}>
          <span className="hub-legend-dot" style={{ background: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}
