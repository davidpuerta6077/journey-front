// Estados de verificación de un curso en Asignia (mismo orden que el flujo).
export const ESTADOS = {
  vacio: { label: 'Vacío', clase: 'badge-pending' },
  asignado: { label: 'Asignado', clase: 'badge-syncing' },
  aceptado: { label: 'Aceptado', clase: 'badge-synced' },
  rechazado: { label: 'Rechazado', clase: 'badge-error' },
  postulado: { label: 'Postulado', clase: 'badge-novedad' },
}

export const horarioTexto = (horario) =>
  (horario || []).map(h => `${h.dia} ${h.hora}${h.aula ? ` (${h.aula})` : ''}`).join(' · ')
