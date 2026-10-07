// Caché en memoria, vive mientras dure la pestaña (se resetea en un F5 duro,
// pero no al navegar entre módulos con el router). Permite el patrón
// "stale-while-revalidate": al entrar a una pantalla, si ya hay un resultado
// de una carga anterior en esta sesión se muestra al instante sin spinner,
// mientras por debajo se pide el dato fresco y se reemplaza cuando llega.
// Varias pantallas que consultan el mismo endpoint (p.ej. Sync Usuarios y
// Módulos Usuarios) comparten la misma key a propósito: lo que se cargó en
// una ya sirve de vista inicial en la otra.
const store = new Map()

export function getCached(key) {
  return store.get(key)
}

export function setCached(key, data) {
  store.set(key, data)
}

export function clearCache() {
  store.clear()
}
