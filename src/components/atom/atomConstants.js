// Mismo vocabulario que api/atom/controller.js (ESTADOS/PRIORIDADES) — si se
// agrega un valor ahí, se agrega acá también.
export const ESTADOS = ['Pendiente', 'En proceso', 'En revisión', 'Completada', 'Cancelada']
export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']

// "En revisión" -> "en-revision": para armar nombres de clase CSS válidos
// (sin espacios ni acentos) a partir de los valores de estado/prioridad.
// ̀-ͯ son las marcas diacríticas combinantes que deja NFD.
export const slug = (v) => (v || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, '-')
