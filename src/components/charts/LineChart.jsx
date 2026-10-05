import ChartBase from './ChartBase'
import { colors, gradientFill, exportingOptions } from './chartTheme'

export default function LineChart({
  data,
  yMax = 250,
  yStep = 50,
  highlightIndex,
  highlightText,
  color = colors.primary,
  height = 260,
}) {
  const points = data.map((d, i) =>
    i === highlightIndex
      ? {
          y: d.value,
          dataLabels: {
            enabled: true,
            formatter: () => highlightText,
            shape: 'callout',
            backgroundColor: color,
            borderRadius: 4,
            padding: 6,
            y: -14,
            style: { color: '#fff', fontWeight: '400', textOutline: 'none' },
          },
        }
      : d.value
  )

  const options = {
    chart: { type: 'area', height },
    exporting: exportingOptions('tendencia-matriculas'),
    legend: { enabled: false },
    xAxis: { categories: data.map((d) => d.label) },
    yAxis: { min: 0, max: yMax, tickInterval: yStep },
    tooltip: { shared: true, valueSuffix: ' matrículas' },
    plotOptions: {
      area: {
        color,
        lineWidth: 2,
        fillColor: gradientFill(color),
        marker: { radius: 3.5, fillColor: color, lineWidth: 0 },
      },
    },
    series: [{ name: 'Matrículas', data: points }],
  }
  return <ChartBase options={options} />
}
