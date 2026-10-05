import ChartBase from './ChartBase'
import { colors } from './chartTheme'

export default function MiniBars({
  data,
  max = Math.max(...data),
  color = colors.primary,
  track = colors.track,
  height = 100,
}) {
  const options = {
    chart: { type: 'column', height, margin: 0, backgroundColor: 'transparent' },
    xAxis: { visible: false },
    yAxis: { visible: false, min: 0, max },
    legend: { enabled: false },
    exporting: { enabled: false },
    tooltip: { headerFormat: '', pointFormat: '<b>{point.y}</b>' },
    plotOptions: {
      column: { grouping: false, pointPadding: 0.08, groupPadding: 0.05, borderRadius: 2, borderWidth: 0 },
    },
    series: [
      { name: 'Fondo', data: data.map(() => max), color: track, enableMouseTracking: false },
      { name: 'Valor', data, color },
    ],
  }
  return <ChartBase options={options} />
}
