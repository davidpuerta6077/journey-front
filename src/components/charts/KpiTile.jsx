import { INK } from './palette'

// Tile de estadística. Número grande + etiqueta. Sin gráfico -> sin hover.
export default function KpiTile({ label, value, hint, accent }) {
  const display = typeof value === 'number' ? value.toLocaleString('es-CO') : (value ?? '—')
  return (
    <div className="kpi-tile">
      <div className="kpi-tile-value" style={accent ? { color: accent } : { color: INK.primary }}>
        {display}
      </div>
      <div className="kpi-tile-label">{label}</div>
      {hint != null && <div className="kpi-tile-hint">{hint}</div>}
    </div>
  )
}
