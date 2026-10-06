import ChartBase from './ChartBase'
import { colors, gradientFill, exportingOptions } from './chartTheme'

// Vista ampliada: ejes y marcadores visibles
const fullOptions = {
  chart: { margin: [60, 40, 50, 70] },
  xAxis: { visible: true },
  yAxis: { visible: true },
  plotOptions: { areaspline: { marker: { enabled: true } } },
}

export default function Sparkline({
  data,
  categories,
  height = 90,
  color = colors.primary,
  title = 'total-estudiantes',
}) {
  const options = {
    chart: { type: 'areaspline', height, margin: [4, 0, 0, 0], backgroundColor: '#ffffff' },
    exporting: exportingOptions(title),
    xAxis: { visible: false, categories },
    yAxis: { visible: false, startOnTick: false, endOnTick: false },
    legend: { enabled: false },
    tooltip: { headerFormat: '', pointFormat: '<b>{point.y}</b>' },
    plotOptions: {
      areaspline: {
        lineWidth: 2.5,
        fillColor: gradientFill(color),
        marker: { enabled: false, states: { hover: { enabled: true } } },
      },
    },
    series: [{ name: 'Total', data, color }],
  }
  return <ChartBase options={options} fullOptions={fullOptions} />
}