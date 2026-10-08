import Highcharts from 'highcharts'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting' // exporta en el navegador, sin servidor externo
import 'highcharts/modules/export-data'

const PALETTES = {
  light: {
    primary: '#5b73c4',
    light: '#b8c3e6',
    track: '#dfe4f4',
    yellow: '#f9ec8f',
    navy: '#2c3a6b',
    text: '#2c3a6b',
    muted: '#6b7694',
    grid: '#e3e7f3',
    tooltipBg: '#ffffff',
    tooltipBorder: '#b8c3e6',
  },
  dark: {
    primary: '#7c93e8',
    light: '#536089',
    track: '#283552',
    yellow: '#f9ec8f',
    navy: '#aebbe0',
    text: '#e2e8f0',
    muted: '#94a3b8',
    grid: 'rgba(148, 163, 184, 0.18)',
    tooltipBg: '#1b2636',
    tooltipBorder: '#334155',
  },
}

// Objeto mutable (no se reasigna, se le hace Object.assign) para que los
// defaults `color = colors.primary` de LineChart/Sparkline/MiniBars y los
// strings armados en DonutChart tomen el valor del tema vigente sin tener
// que pasar el tema como prop a cada gráfico.
export const colors = { ...PALETTES.light }

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

// Aplica la paleta claro/oscuro: muta `colors` (misma referencia, para que lo
// lean los defaults de los demás componentes de charts) y reconfigura los
// defaults globales de Highcharts. El fondo del chart queda transparente
// -antes era '#ffffff' fijo- para que herede el fondo de la tarjeta
// (var(--bg-surface)/var(--hub-bg-card)) en vez de verse blanco sobre el
// tema oscuro. Avisa por evento para que ChartBase fuerce recrear los
// gráficos ya montados (los que vienen de antes de este cambio no actualizan
// solos lo que Highcharts.setOptions toca si no se vuelven a construir).
export function applyChartTheme(dark) {
  Object.assign(colors, dark ? PALETTES.dark : PALETTES.light)
  Highcharts.setOptions({
    colors: [colors.primary, colors.light, colors.yellow, colors.navy],
    chart: {
      backgroundColor: 'transparent',
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
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderRadius: 8,
      style: { color: colors.text },
    },
  })
  window.dispatchEvent(new CustomEvent('bravohub:chart-theme'))
}

applyChartTheme((localStorage.getItem('bravohub_theme') || 'light') === 'dark')

/* Idioma (fijo, no depende del tema) */
Highcharts.setOptions({
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
