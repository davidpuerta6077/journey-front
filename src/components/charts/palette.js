// Paleta de gráficos. Validada con el validador de dataviz (light, surface #fcfcfb):
// lightness band OK, chroma floor OK, CVD separation PASS (ΔE 9.1), contraste OK.
// Orden FIJO: se asignan por posición, nunca se ciclan. Una 6.ª categoría cae en "Otros".
export const CATEGORICAL = ['#4a70e0', '#e0733a', '#1f9e9e', '#9b59b6', '#d64545']

// Estado (reservado: nunca se usa como "serie N"). Siempre con etiqueta, no solo color.
export const STATUS = {
  ok: '#2a9d6f',        // sincronizado / activo / correcto
  warn: '#d99a2b',      // novedad / pendiente
  error: '#d64545',     // error / falta
  neutral: '#6b7280',   // sin estado / desconocido
}

// Magnitud (una sola tinta, claro -> oscuro).
export const SEQUENTIAL = ['#dce6fb', '#a9c1f4', '#4a70e0', '#2a4ba0']

// Tinta de texto (los valores/etiquetas nunca llevan el color de la serie).
export const INK = { primary: '#1f2937', secondary: '#4b5563', muted: '#9ca3af' }
export const GRID = '#e5e7eb'

// Color por índice de serie/categoría, con fallback a gris para la 6.ª+.
export function colorFor(i) {
  return CATEGORICAL[i] ?? STATUS.neutral
}

// Mapea nombres de estado conocidos a su color de STATUS; el resto va por CATEGORICAL.
const ESTADO_ALIASES = {
  sincronizado: STATUS.ok, activo: STATUS.ok, activa: STATUS.ok, ok: STATUS.ok, true: STATUS.ok,
  novedad: STATUS.warn, pendiente: STATUS.warn, sincronizando: STATUS.warn,
  error: STATUS.error, falta_en_moodle: STATUS.error, falta_en_journey: STATUS.error,
  '(sin estado)': STATUS.neutral, inactivo: STATUS.neutral, false: STATUS.neutral,
}
export function colorForEstado(nombre, i = 0) {
  const key = String(nombre ?? '').toLowerCase().trim()
  return ESTADO_ALIASES[key] ?? colorFor(i)
}
