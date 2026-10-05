// Coerción numérica compartida por los dashboards de Reportes.
// numOr0: para sumar/promediar (un valor no numérico aporta 0).
// numOrNaN: para detectar si una columna es numérica (conserva NaN).
export const numOr0 = (v) => (typeof v === 'number' ? v : Number(v)) || 0
export const numOrNaN = (v) => (typeof v === 'number' ? v : Number(v))
