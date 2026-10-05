import ChartBase from './ChartBase'
import { exportingOptions } from './chartTheme'

export default function StackedBarChart({ data, series, yMax = 100, yStep = 20, height = 230 }) {
  const options = {
    chart: { type: 'column', height },
    exporting: exportingOptions('cursos-por-facultad'),
    legend: { layout: 'vertical', align: 'right', verticalAlign: 'middle', itemMarginBottom: 8, symbolRadius: 9 },
    xAxis: { categories: data.map((d) => d.label) },
    yAxis: { min: 0, max: yMax, tickInterval: yStep },
    tooltip: { shared: true },
    plotOptions: { column: { stacking: 'normal', borderWidth: 0, pointPadding: 0.1, groupPadding: 0.1 } },
    series: series.map((s) => ({
      name: s.label,
      color: s.color,
      data: data.map((d) => d[s.key]),
    })),
  }
  return <ChartBase options={options} />
}
