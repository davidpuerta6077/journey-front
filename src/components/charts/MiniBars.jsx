import ChartBase from './ChartBase'
import { colors, exportingOptions } from './chartTheme'

// Vista ampliada: ejes visibles y márgenes para etiquetas
const fullOptions = {
  chart: { margin: [60, 40, 50, 70] },
  xAxis: { visible: true },
  yAxis: { visible: true },
}

export default function MiniBars({
  data,
  categories,
  max = Math.max(...data),
  color = colors.primary,
  track = colors.track,
  height = 100,
  title = 'barras',
}) {
  const options = {
    chart: { type: 'column', height, margin: 0, backgroundColor: '#ffffff' },
    exporting: exportingOptions(title),
    xAxis: { visible: false, categories },
    yAxis: { visible: false, min: 0, max },
    legend: { enabled: false },
    tooltip: { headerFormat: '', pointFormat: '<b>{point.y}</b>' },
    plotOptions: {
      column: { grouping: false, pointPadding: 0.08, groupPadding: 0.05, borderRadius: 2, borderWidth: 0 },
    },
    series: [
      // Fondo decorativo: no se incluye en CSV/XLS ni responde al mouse
      { name: 'Fondo', data: data.map(() => max), color: track, enableMouseTracking: false, includeInDataExport: false },
      { name: 'Valor', data, color },
    ],
  }
  return <ChartBase options={options} fullOptions={fullOptions} />
}