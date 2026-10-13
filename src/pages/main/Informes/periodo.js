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
