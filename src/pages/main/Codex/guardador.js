// Cola de guardado de una página de CodeX: agrupa cambios seguidos (espera
// `espera` ms), deja una sola petición en vuelo y, si llegan cambios mientras
// guarda, guarda el último al terminar. No repite lo ya guardado. Si la API
// falla, avisa y deja el cambio pendiente: se reintenta con el siguiente
// cambio o al vaciar (al salir), nunca en bucle.
export function crearGuardador({ guardar, onGuardado, onError, espera = 2000 }) {
  let confirmado = null // JSON del último estado que la API confirmó
  let pendiente = null  // JSON por guardar
  let timer = null
  let enVuelo = null
  let fallo = false     // el último intento falló (el editor muestra error)

  function inicial(bloques) {
    confirmado = JSON.stringify(bloques)
  }

  function cambio(bloques) {
    pendiente = JSON.stringify(bloques)
    clearTimeout(timer)
    timer = setTimeout(() => { timer = null; vaciar() }, espera)
  }

  async function vaciar() {
    clearTimeout(timer)
    timer = null
    while (enVuelo) await enVuelo
    if (pendiente === null) return
    if (pendiente === confirmado) {
      pendiente = null
      // Tras un error, volver (ej. deshacer) a lo ya guardado: quitar el aviso de error.
      if (fallo) { fallo = false; onGuardado?.() }
      return
    }
    const json = pendiente
    pendiente = null
    // guardar se llama ya (sin esperar un tick): al salir de la página la
    // petición sale antes de que el componente se desmonte.
    let peticion
    try { peticion = Promise.resolve(guardar(JSON.parse(json))) } catch (e) { peticion = Promise.reject(e) }
    enVuelo = peticion
      .then(
        () => { confirmado = json; fallo = false; onGuardado?.() },
        (e) => { if (pendiente === null) pendiente = json; fallo = true; onError?.(e) },
      )
      .finally(() => { enVuelo = null })
    await enVuelo
  }

  const hayPendiente = () => enVuelo !== null || (pendiente !== null && pendiente !== confirmado)

  return { inicial, cambio, vaciar, hayPendiente }
}
