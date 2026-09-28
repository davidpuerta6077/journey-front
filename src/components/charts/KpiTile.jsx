import { INK } from './palette'
import '../../styles/components/charts.css'

// Tile de estadística. Número grande + etiqueta. Con `onClick` se vuelve un
// botón que filtra el detalle del reporte a esas filas (`active` = filtro puesto).
export default function KpiTile({ label, value, hint, accent, onClick, active }) {
  const display = typeof value === 'number' ? value.toLocaleString('es-CO') : (value ?? '—')
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className={`kpi-tile${onClick ? ' kpi-tile-clickable' : ''}${active ? ' kpi-tile-active' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      title={onClick ? 'Ver estas filas en el detalle' : undefined}
    >
      <div className="kpi-tile-value" style={accent ? { color: accent } : { color: INK.primary }}>
        {display}
      </div>
      <div className="kpi-tile-label">{label}</div>
      {hint != null && <div className="kpi-tile-hint">{hint}</div>}
    </Tag>
  )
}
