import ChartBase from './ChartBase'
import { colors, gradientFill } from './chartTheme'

export default function Sparkline({ data, height = 90, color = colors.primary }) {
  const options = {
    chart: { type: 'areaspline', height, margin: [4, 0, 0, 0], backgroundColor: 'transparent' },
    xAxis: { visible: false },
    yAxis: { visible: false, startOnTick: false, endOnTick: false },
    legend: { enabled: false },
    exporting: { enabled: false },
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
  return <ChartBase options={options} />
}
