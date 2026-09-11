import { useMemo } from 'react'
import TablaResultado from './TablaResultado'
import KpiTile from '../../../components/charts/KpiTile'
import BarChartCard from '../../../components/charts/BarChartCard'
import LineChartCard from '../../../components/charts/LineChartCard'
import { dashboardParaTipo } from './dashboards'
import { numOr0, numOrNaN } from './dashboardHelpers'

const esFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const esNumerica = (rows, key) =>
  rows.some((r) => r[key] != null) &&
  rows.every((r) => r[key] == null || (r[key] !== '' && Number.isFinite(numOrNaN(r[key]))))

// Dashboard genérico: infiere KPIs y un gráfico del shape de los datos.
function generico({ columns, rows }) {
  const keys = columns.map((c) => c.key)
  const numericas = keys.filter((k) => esNumerica(rows, k))
  const dimensiones = keys.filter((k) => !numericas.includes(k))
  const fechaKey = keys.find((k) => ['dia', 'fecha', 'date'].includes(k) || (rows[0] && esFecha(rows[0][k])))

  const kpis = [{ label: 'Filas', value: rows.length }]
  for (const k of numericas.slice(0, 3)) {
    const col = columns.find((c) => c.key === k)
    const total = rows.reduce((a, r) => a + numOr0(r[k]), 0)
    const esProm = /prom|media|promedio/i.test(k)
    kpis.push({
      label: col?.label || k,
      value: esProm ? Number((total / (rows.length || 1)).toFixed(2)) : total,
      hint: esProm ? 'promedio' : 'suma',
    })
  }

  const charts = []
  if (numericas.length && fechaKey) {
    const cron = [...rows].sort((a, b) => String(a[fechaKey]).localeCompare(String(b[fechaKey])))
    charts.push(
      <LineChartCard key="l" title={`${columns.find((c) => c.key === numericas[0])?.label || numericas[0]} en el tiempo`}
        data={cron} xKey={fechaKey}
        series={numericas.slice(0, 2).map((k) => ({ key: k, label: columns.find((c) => c.key === k)?.label || k }))} />
    )
  } else if (numericas.length && dimensiones.length && rows.length <= 25) {
    const xKey = dimensiones[0]
    charts.push(
      <BarChartCard key="b" title={`${columns.find((c) => c.key === numericas[0])?.label || numericas[0]} por ${columns.find((c) => c.key === xKey)?.label || xKey}`}
        data={rows} xKey={xKey}
        series={numericas.slice(0, 2).map((k) => ({ key: k, label: columns.find((c) => c.key === k)?.label || k }))}
        orientation="y" height={Math.max(240, rows.length * 30)} />
    )
  }
  return { kpis, charts }
}

export default function ReporteDashboard({ resultado, tipo }) {
  // Inferir tipos de columna y agregados recorre todas las filas; se memoiza
  // para no repetirlo en cada render (re-ejecuciones, toggles del <details>).
  const { kpis, charts } = useMemo(() => {
    const rows = resultado?.rows ?? []
    if (!resultado) return { kpis: [], charts: [] }
    const derivado =
      (rows.length ? dashboardParaTipo(tipo, resultado) : null) ||
      (rows.length ? generico(resultado) : { kpis: [{ label: 'Filas', value: 0 }], charts: [] })
    return { kpis: derivado.kpis ?? [], charts: derivado.charts ?? [] }
  }, [resultado, tipo])

  if (!resultado) return null
  const { rows = [] } = resultado

  return (
    <div className="reporte-dashboard">
      {kpis.length > 0 && (
        <div className="kpi-row">
          {kpis.map((k, i) => <KpiTile key={i} {...k} />)}
        </div>
      )}
      {charts.length > 0 && (
        <div className="chart-grid">
          {charts}
        </div>
      )}
      <details className="reporte-tabla-wrap" open={charts.length === 0}>
        <summary>Ver datos ({rows.length} fila{rows.length === 1 ? '' : 's'})</summary>
        <TablaResultado resultado={resultado} />
      </details>
    </div>
  )
}
