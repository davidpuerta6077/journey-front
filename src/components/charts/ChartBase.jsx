import HighchartsReact from 'highcharts-react-official'
import Highcharts from './chartTheme'

export default function ChartBase({ options }) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{ style: { width: '100%' } }}
    />
  )
}
