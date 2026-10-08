import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import HighchartsReactModule from 'highcharts-react-official'
import Highcharts from './chartTheme'

const HighchartsReact = HighchartsReactModule.default ?? HighchartsReactModule

const hasMenu = (o) => o.exporting && o.exporting.enabled !== false

export default function ChartBase({ options, fullOptions = {} }) {
  const [expanded, setExpanded] = useState(false)
  // Highcharts.setOptions (ver chartTheme.js) solo afecta gráficos nuevos: uno
  // ya montado no recoge el cambio de tema por sí solo. themeTick fuerza un
  // remount (key) cuando SideNavMain avisa que cambió claro/oscuro.
  const [themeTick, setThemeTick] = useState(0)
  useEffect(() => {
    const onThemeChange = () => setThemeTick(t => t + 1)
    window.addEventListener('bravohub:chart-theme', onThemeChange)
    return () => window.removeEventListener('bravohub:chart-theme', onThemeChange)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => e.key === 'Escape' && setExpanded(false)
    const prevOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [expanded])

  // Gráfico normal: "Ver en pantalla completa" abre la capa
  const normal = hasMenu(options)
    ? Highcharts.merge(options, {
      exporting: {
        menuItemDefinitions: {
          viewFullscreen: {
            text: 'Ver en pantalla completa',
            onclick: () => setExpanded(true),
          },
        },
      },
    })
    : options

  // Gráfico en la capa: sin alto fijo y con opción para salir
  const items = options.exporting?.buttons?.contextButton?.menuItems ?? []
  const full = Highcharts.merge(options, fullOptions, {
    chart: { height: null },
    exporting: {
      buttons: {
        contextButton: {
          menuItems: items.map((i) => (i === 'viewFullscreen' ? 'closeFullscreen' : i)),
        },
      },
      menuItemDefinitions: {
        closeFullscreen: {
          text: 'Salir de pantalla completa',
          onclick: () => setExpanded(false),
        },
      },
    },
  })

  return (
    <>
      <HighchartsReact
        key={themeTick}
        highcharts={Highcharts}
        options={normal}
        containerProps={{ style: { width: '100%' } }}
      />

      {expanded &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'var(--bg-page)',
              padding: 24,
              boxSizing: 'border-box',
            }}
          >
            <HighchartsReact
              key={themeTick}
              highcharts={Highcharts}
              options={full}
              containerProps={{
                style: { width: '100%', height: 'calc(100vh - 48px)' },
              }}
            />
          </div>,
          document.body
        )}
    </>
  )
}