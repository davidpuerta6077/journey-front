import Highcharts from 'highcharts'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting' // exporta en el navegador, sin servidor externo
import 'highcharts/modules/export-data'
import 'highcharts/modules/full-screen'

export const colors = {
  primary: '#5b73c4',
  light: '#b8c3e6',
  track: '#dfe4f4',
  yellow: '#f9ec8f',
  navy: '#2c3a6b',
  text: '#2c3a6b',
  muted: '#6b7694',
  grid: '#e3e7f3',
}

export const fade = (color, alpha) =>
  Highcharts.color(color).setOpacity(alpha).get('rgba')

export const gradientFill = (color) => ({
  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
  stops: [
    [0, fade(color, 0.35)],
    [1, fade(color, 0)],
  ],
})

/* Menú de exportación + pantalla completa */
export const exportingOptions = (filename = 'bravo-hub') => ({
  enabled: true,
  filename,
  fallbackToExportServer: false,
  buttons: {
    contextButton: {
      symbolStroke: colors.primary,
      theme: { fill: 'transparent', states: { hover: { fill: colors.track } } },
      menuItems: [
        'viewFullscreen',
        'printChart',
        'separator',
        'downloadPNG',
        'downloadJPEG',
        'downloadSVG',
        'separator',
        'downloadCSV',
        'downloadXLS',
      ],
    },
  },
})

/* Tema global */
Highcharts.setOptions({
  colors: [colors.primary, colors.light, colors.yellow, colors.navy],
  chart: {
    backgroundColor: '#ffffff', // también aplica en pantalla completa
    style: { fontFamily: 'inherit' },
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    itemStyle: { color: colors.text, fontWeight: '400', fontSize: '14px' },
    itemHoverStyle: { color: colors.primary },
  },
  xAxis: {
    lineColor: colors.grid,
    tickColor: colors.grid,
    labels: { style: { color: colors.muted } },
  },
  yAxis: {
    title: { text: undefined },
    gridLineColor: colors.grid,
    labels: { style: { color: colors.muted } },
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: colors.light,
    borderRadius: 8,
    style: { color: colors.text },
  },
  lang: {
    thousandsSep: '.',
    decimalPoint: ',',
    contextButtonTitle: 'Opciones del gráfico',
    viewFullscreen: 'Ver en pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    printChart: 'Imprimir gráfico',
    downloadPNG: 'Descargar PNG',
    downloadJPEG: 'Descargar JPEG',
    downloadSVG: 'Descargar SVG',
    downloadCSV: 'Descargar CSV',
    downloadXLS: 'Descargar XLS',
  },
})

export default Highcharts
