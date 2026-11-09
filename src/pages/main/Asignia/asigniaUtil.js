// Colores de estado de Asignia: los mismos en tarjetas, etiquetas y calendario,
// siempre acompañados del texto (el color nunca es la única señal).
//   aceptado verde · en revisión azul · disponible gris · rechazado rojo · por responder amarillo
// clase = badge (etiqueta); tarjeta = contador/filtro (.asignia-estado-*); cal = bloque del calendario.
export const TONOS = {
  responder: { label: 'Por responder', clase: 'badge-novedad', tarjeta: 'asignia-estado-responder', cal: 'cal-e-responder' },
  aceptado: { label: 'Aceptado', clase: 'badge-synced', tarjeta: 'asignia-estado-aceptado', cal: 'cal-e-aceptado' },
  revision: { label: 'En revisión', clase: 'badge-syncing', tarjeta: 'asignia-estado-revision', cal: 'cal-e-revision' },
  disponible: { label: 'Disponible', clase: 'badge-pending', tarjeta: 'asignia-estado-disponible', cal: 'cal-e-disponible' },
  rechazado: { label: 'Rechazado', clase: 'badge-error', tarjeta: 'asignia-estado-rechazado', cal: 'cal-e-rechazado' },
}

// Estados de verificación de un curso (mismo orden que el flujo).
// vacio = sin profesor (disponible para postularse); asignado = el profesor aún no responde;
// postulado = tiene postulaciones en revisión.
export const ESTADOS = {
  vacio: TONOS.disponible,
  asignado: TONOS.responder,
  aceptado: TONOS.aceptado,
  rechazado: TONOS.rechazado,
  postulado: TONOS.revision,
}

// Estado de una postulación (líder y profesor).
export const ESTADO_POST = {
  pendiente: TONOS.revision,
  aprobada: { ...TONOS.aceptado, label: 'Aprobada' },
  rechazada: { ...TONOS.rechazado, label: 'Rechazada' },
  descartada: { ...TONOS.rechazado, label: 'No seleccionada' },
}

export const horarioTexto = (horario) =>
  (horario || []).map(h => `${h.dia} ${h.hora}${h.aula ? ` (${h.aula})` : ''}`).join(' · ')

// Causales para rechazar una postulación (misma lista en journey-api, api/asignia/controller.js).
export const CAUSALES_RECHAZO = [
  'Cruce de horario con otra asignación',
  'Perfil o formación no corresponde a la asignatura',
  'El curso ya fue asignado a otro profesor',
  'Se supera la carga académica máxima permitida',
  'Documentación o requisitos incompletos',
  'El curso fue cancelado o no abrió por falta de estudiantes',
  'Otro',
]

// Filtros de horario compartidos (vista del profesor, Programación y Calendario del líder).
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const FRANJAS = [
  { v: 'manana', label: 'Mañana (6:00–12:00)' },
  { v: 'tarde', label: 'Tarde (12:00–18:00)' },
  { v: 'noche', label: 'Noche (18:00 en adelante)' },
]
// Franja según la hora de inicio ("06:00 - 08:00" -> mañana).
export const franjaDe = (hora) => {
  const h = parseInt(String(hora || '').slice(0, 2), 10)
  if (Number.isNaN(h)) return null
  return h < 12 ? 'manana' : h < 18 ? 'tarde' : 'noche'
}
// ¿El curso cumple día, franja (en ese día si se eligió) y horas por semana?
export function cumpleHorario(c, { dia, franja, horas }) {
  const horario = c.horario || []
  return (!horas || String(c.horas_semana) === horas)
    && (!dia || horario.some(h => h.dia === dia))
    && (!franja || horario.some(h => (!dia || h.dia === dia) && franjaDe(h.hora) === franja))
}
// Valores distintos de "H. semana" ordenados numéricamente.
export const horasDistintas = (lista) =>
  [...new Set(lista.map(c => c.horas_semana).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
