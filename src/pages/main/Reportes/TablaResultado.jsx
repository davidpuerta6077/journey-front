export default function TablaResultado({ resultado }) {
  if (!resultado) return null
  const { columns = [], rows = [], meta = {} } = resultado

  return (
    <div className="reportes-resultado">
      <div className="reportes-resultado-meta">
        {rows.length} fila(s) · generado {meta.generatedAt ? new Date(meta.generatedAt).toLocaleString() : '—'}
      </div>
      <div className="reportes-tabla-scroll">
        <table className="reportes-tabla">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length || 1}>Sin datos</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i}>{columns.map((c) => <td key={c.key}>{String(row[c.key] ?? '')}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
