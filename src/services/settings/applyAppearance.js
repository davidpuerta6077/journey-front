// Aplica los settings de la categoría "apariencia" como variables CSS en
// :root, para que tomen efecto sin recargar media de verdad (fuente, color
// primario/secundario). Si un valor no viene, se deja el default que ya
// trae styles/global/index.css (no se borra nada).
export function applyAppearance(settings) {
  const porClave = Object.fromEntries((settings || []).map(s => [s.clave, s.valor]))
  const root = document.documentElement.style
  if (porClave.color_primario)   root.setProperty('--primary', porClave.color_primario)
  if (porClave.color_secundario) root.setProperty('--secondary', porClave.color_secundario)
  if (porClave.color_nav)        root.setProperty('--nav-bg', porClave.color_nav)
  if (porClave.color_menu)       root.setProperty('--menu-bg', porClave.color_menu)
  if (porClave.tipografia)       root.setProperty('--font-base', porClave.tipografia)
  return porClave
}
