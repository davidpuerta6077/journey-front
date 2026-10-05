import { useMemo, useState } from 'react'
import TablaDetalle from './TablaDetalle'
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
function generico({ columns, rows }, ctx) {
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
        orientation="y" height={Math.max(240, rows.length * 30)}
        onSelect={ctx.drill(xKey)} />
    )
  }
  return { kpis, charts }
}

// Resumen arriba (KPIs + gráficos) y, debajo, siempre visible, la tabla con el
// detalle real del reporte (resultado.detalle si el backend lo manda; si no,
// las mismas filas del resultado). Clic en un KPI o en una barra/porción
// filtra el detalle a esas filas.
export default function ReporteDashboard({ resultado, tipo, nombre }) {
  // El filtro se guarda junto al resultado al que pertenece: al re-ejecutar
  // el reporte (resultado nuevo) deja de aplicar solo.
  const [filtroDe, setFiltroDe] = useState({ resultado: null, filtro: null })
  const filtro = filtroDe.resultado === resultado ? filtroDe.filtro : null

  const detalle = useMemo(() => {
    if (!resultado) return null
    return resultado.detalle || { titulo: 'Resultados', columns: resultado.columns || [], rows: resultado.rows || [] }
  }, [resultado])

  const ctx = useMemo(() => {
    const labelDe = (key) =>
      detalle?.columns.find((c) => c.key === key)?.label ||
      resultado?.columns?.find((c) => c.key === key)?.label || key
    const aplicar = (f) => setFiltroDe({ resultado, filtro: f })
    return {
      // Filtra el detalle por una columna: drill('estado')('error').
      drill: (key) => (value) => aplicar({
        label: `${labelDe(key)}: ${value}`,
        fn: (r) => String(r[key] ?? '(sin valor)') === String(value),
      }),
      // Filtro con condición propia (KPIs): filtrar('Nunca accedieron', r => ...).
      filtrar: (label, fn) => () => aplicar({ label, fn }),
    }
  }, [resultado, detalle])

  const { kpis, charts } = useMemo(() => {
    const rows = resultado?.rows ?? []
    if (!resultado) return { kpis: [], charts: [] }
    const derivado =
      (rows.length ? dashboardParaTipo(tipo, resultado, ctx) : null) ||
      (rows.length ? generico(resultado, ctx) : { kpis: [{ label: 'Filas', value: 0 }], charts: [] })
    return { kpis: derivado.kpis ?? [], charts: derivado.charts ?? [] }
  }, [resultado, tipo, ctx])

  if (!resultado) return null

  return (
    <div className="reporte-dashboard">
      {kpis.length > 0 && (
        <div className="kpi-row">
          {kpis.map(({ filtroLabel, ...k }, i) => (
            <KpiTile key={i} {...k} active={!!filtroLabel && filtro?.label === filtroLabel} />
          ))}
        </div>
      )}
      {charts.length > 0 && (
        <div className="chart-grid">
          {charts}
        </div>
      )}
      <TablaDetalle
        titulo={detalle.titulo}
        columns={detalle.columns}
        rows={detalle.rows}
        filtro={filtro}
        onQuitarFiltro={() => setFiltroDe({ resultado, filtro: null })}
        nombreArchivo={nombre}
      />
      {resultado.detalle && (
        <details className="reporte-tabla-wrap">
          <summary>Ver tabla resumen ({resultado.rows.length} fila{resultado.rows.length === 1 ? '' : 's'})</summary>
          <TablaDetalle titulo="Resumen" columns={resultado.columns} rows={resultado.rows} nombreArchivo={`${nombre || 'reporte'}-resumen`} />
        </details>
      )}
    </div>
  )
}
