// Vocabulario común de novedades (el de SICAU), para que las dos pestañas de
// Sync > Novedades nombren igual lo mismo: "Cambio de grupo",
// "Cambio de estado · Cancelación", "Retiro de curso"...

export const humanize = (s) => {
  const t = String(s || '').replace(/_/g, ' ').trim().toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const ESTADO_NOVEDAD = {
  cancelado: 'Cancelación', cancelada: 'Cancelación',
  retirado: 'Retiro', retirada: 'Retiro',
  finalizado: 'Finalización', finalizada: 'Finalización',
  suspendido: 'Suspensión', suspendida: 'Suspensión',
}

export const esEstadoDeNovedad = (estado) => !!ESTADO_NOVEDAD[String(estado || '').trim().toLowerCase()]

export function nombreCambioEstado(estado) {
  const e = ESTADO_NOVEDAD[String(estado || '').trim().toLowerCase()]
  return `Cambio de estado · ${e || humanize(estado)}`
}

export const TIPOS_SICAU_CONOCIDOS = ['CAMBIO_DE_GRUPO', 'CAMBIO_DE_ESTADO', 'RETIRO']

// Nombre de una novedad tal como la reporta SICAU (fila de sicau_novedades).
export function nombreNovedadSicau(n) {
  if (n.tipo === 'CAMBIO_DE_GRUPO') return 'Cambio de grupo'
  if (n.tipo === 'RETIRO') return 'Retiro de curso'
  if (n.tipo === 'CAMBIO_DE_ESTADO') {
    const cambio = (Array.isArray(n.cambios) ? n.cambios : []).find(c => c.campo === 'estado')
    return cambio?.actual ? nombreCambioEstado(cambio.actual) : 'Cambio de estado'
  }
  return humanize(n.tipo) || 'Sin tipo'
}

export function claseNovedad(nombre) {
  if (nombre === 'Cambio de grupo') return 'badge-novedad'
  if (nombre === 'Desmatriculando') return 'badge-syncing'
  if (['Retiro de curso', 'Desmatriculado', 'Duplicado (2 grupos)', 'Cambio de estado · Retiro', 'Cambio de estado · Finalización'].includes(nombre)) return 'badge-error'
  return 'badge-pending'
}
