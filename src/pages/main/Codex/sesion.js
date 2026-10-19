// Lado hub de una página abierta en el editor CodeX: responde a los mensajes
// del iframe y guarda al salir. Recuerda los últimos bloques recibidos para
// que, si el iframe se recarga, reciba lo editado y no lo de la apertura.
export function crearSesion({ bloques, guardador }) {
  let ultimos = bloques

  function mensaje(data) {
    if (data?.tipo === 'codex:ready') return { tipo: 'codex:load', bloques: ultimos }
    if (data?.tipo === 'codex:change' && Array.isArray(data.bloques)) {
      ultimos = data.bloques
      guardador.cambio(data.bloques)
    }
    return null
  }

  // leerActual: lectura síncrona del estado del editor (mismo origen); cubre
  // lo editado en los últimos 500 ms que el editor aún no envió.
  async function salir(leerActual) {
    const actual = leerActual?.()
    if (Array.isArray(actual)) { ultimos = actual; guardador.cambio(actual) }
    await guardador.vaciar()
    return !guardador.hayPendiente()
  }

  return { mensaje, salir }
}
