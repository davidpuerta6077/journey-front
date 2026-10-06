import ChartBase from './ChartBase'
import { colors, exportingOptions } from './chartTheme'

export default function DonutChart({ segments, centerLabel = 'Total', height = 230 }) {
  const total = segments.reduce((s, d) => s + d.value, 0)

  const options = {
    chart: {
      type: 'pie',
      height,
      events: {
        // Texto central (total). Se redibuja en cada render y viaja en la exportación.
        render() {
          const [cx, cy] = this.series[0].center
          this.centerText?.destroy()
          this.centerText = this.renderer
            .text(
              `<span style="font-size:24px;font-weight:700;color:${colors.navy}">${total}</span><br/>` +
                `<span style="font-size:12px;color:${colors.muted}">${centerLabel}</span>`,
              this.plotLeft + cx,
              this.plotTop + cy - 2
            )
            .attr({ align: 'center', zIndex: 5 })
            .add()
        },
      },
    },
    exporting: exportingOptions('distribucion-modalidad'),
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
      itemMarginBottom: 10,
      symbolRadius: 9,
      symbolHeight: 16,
      symbolWidth: 16,
    },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerSize: '72%',
        size: '90%',
        center: ['36%', '50%'],
        borderWidth: 0,
        showInLegend: true,
        dataLabels: { enabled: false },
      },
    },
    series: [
      {
        name: 'Total',
        data: segments.map((s) => ({ name: s.label, y: s.value, color: s.color })),
      },
    ],
  }
  return <ChartBase options={options} />
}
