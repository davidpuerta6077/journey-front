export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function periodoActual() {
  const hoy = new Date()
  return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() }
}

export function aniosDisponibles() {
  const actual = new Date().getFullYear()
  return [actual - 2, actual - 1, actual, actual + 1]
}

// Mes anterior (-1) o siguiente (+1), cruzando el año.
export function mover({ mes, anio }, d) {
  const m = mes - 1 + d
  return { mes: ((m % 12) + 12) % 12 + 1, anio: anio + Math.floor(m / 12) }
}
