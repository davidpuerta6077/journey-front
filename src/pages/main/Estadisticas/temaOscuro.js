import { useSyncExternalStore } from 'react'

// Tema actual (data-theme en <html>), para que los textos de los SVG se lean en oscuro.
function suscribir(cb) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}
const leer = () => document.documentElement.getAttribute('data-theme') === 'dark'

export default function useTemaOscuro() {
  return useSyncExternalStore(suscribir, leer)
}
