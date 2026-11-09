// Utilidades del calendario de Asignia. Fechas como texto 'YYYY-MM-DD' con
// aritmética en UTC (día calendario); "hoy" se toma en America/Bogota.

export const DIAS_CAL = [
  { num: 1, nombre: 'Lunes', corto: 'Lun' },
  { num: 2, nombre: 'Martes', corto: 'Mar' },
  { num: 3, nombre: 'Miércoles', corto: 'Mié' },
  { num: 4, nombre: 'Jueves', corto: 'Jue' },
  { num: 5, nombre: 'Viernes', corto: 'Vie' },
  { num: 6, nombre: 'Sábado', corto: 'Sáb' },
]
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const TIPO_CRUCE = {
  profesor: 'Cruce de profesor',
  aula: 'Cruce de aula',
  grupo: 'Posible cruce de grupo',
}

const fecha = (iso) => new Date(`${iso}T00:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)

export const sumarDias = (s, n) => iso(new Date(fecha(s).getTime() + n * 86400000))
export const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
export const diaSemana = (s) => fecha(s).getUTCDay() || 7 // 1 = lunes ... 7 = domingo
export const lunesDe = (s) => sumarDias(s, 1 - diaSemana(s))
export const minutos = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  return h * 60 + (m || 0)
}
export const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Lunes de cada semana del semestre (la primera puede empezar antes de fecha_inicio).
export function semanasDelSemestre(semestre) {
  if (!semestre?.fecha_inicio || !semestre?.fecha_fin) return []
  const out = []
  for (let l = lunesDe(semestre.fecha_inicio); l <= semestre.fecha_fin; l = sumarDias(l, 7)) out.push(l)
  return out
}

// "9 – 14 de marzo de 2026", "30 de marzo – 4 de abril de 2026", "28 dic 2026 – 2 ene 2027"
export function rangoSemana(lunes) {
  const a = fecha(lunes)
  const b = fecha(sumarDias(lunes, 5))
  const [da, ma, ya] = [a.getUTCDate(), a.getUTCMonth(), a.getUTCFullYear()]
  const [db, mb, yb] = [b.getUTCDate(), b.getUTCMonth(), b.getUTCFullYear()]
  if (ya !== yb) return `${da} ${MESES_CORTOS[ma]} ${ya} – ${db} ${MESES_CORTOS[mb]} ${yb}`
  if (ma !== mb) return `${da} de ${MESES[ma]} – ${db} de ${MESES[mb]} de ${yb}`
  return `${da} – ${db} de ${MESES[mb]} de ${yb}`
}
export const fechaCorta = (s) => { const d = fecha(s); return `${d.getUTCDate()} ${MESES_CORTOS[d.getUTCMonth()]}` }
export const fechaLarga = (s) => { const d = fecha(s); return `${DIAS_CAL[(d.getUTCDay() || 7) - 1]?.nombre || 'Domingo'} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}` }

// { 'YYYY-MM-DD': { nombre, tipo: 'festivo'|'institucional'|'semana' } } de los días sin clase.
export function diasSinClase(noLaborables = [], semanas = []) {
  const m = {}
  for (const s of semanas) {
    if (s.sin_clase === false) continue
    for (let d = s.fecha_inicio; d <= s.fecha_fin; d = sumarDias(d, 1)) m[d] = { nombre: s.nombre, tipo: 'semana' }
  }
  for (const n of noLaborables) if (n.activo !== false) m[n.fecha] = { nombre: n.nombre, tipo: n.tipo }
  return m
}

// Semanas marcadas pero con clase (p. ej. parciales): { 'YYYY-MM-DD': nombre }.
export function diasMarcados(semanas = []) {
  const m = {}
  for (const s of semanas) {
    if (s.sin_clase !== false) continue
    for (let d = s.fecha_inicio; d <= s.fecha_fin; d = sumarDias(d, 1)) m[d] = s.nombre
  }
  return m
}

// Color estable por clave (asignatura o profesor): 12 tonos pastel definidos en CSS.
export const N_COLORES = 12
export function colorDe(clave) {
  let h = 0
  for (const ch of String(clave || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % N_COLORES
}

// Reparte en carriles las sesiones de un día que se solapan, para dibujarlas lado
// a lado: devuelve Map(id -> { carril, carriles }). Cada grupo de sesiones
// encadenadas por solapes comparte el mismo número de carriles.
export function carriles(sesiones) {
  const orden = [...sesiones].sort((a, b) => a.inicioMin - b.inicioMin || b.finMin - a.finMin)
  const res = new Map()
  let grupo = []
  let finGrupo = -1
  const cerrar = () => {
    const fines = [] // fin del último bloque de cada carril
    for (const s of grupo) {
      let c = fines.findIndex(f => f <= s.inicioMin)
      if (c === -1) { c = fines.length; fines.push(0) }
      fines[c] = s.finMin
      res.set(s.id, { carril: c, carriles: 0 })
    }
    for (const s of grupo) res.get(s.id).carriles = fines.length
    grupo = []
  }
  for (const s of orden) {
    if (grupo.length && s.inicioMin >= finGrupo) cerrar()
    if (!grupo.length) finGrupo = s.finMin
    grupo.push(s)
    finGrupo = Math.max(finGrupo, s.finMin)
  }
  if (grupo.length) cerrar()
  return res
}

// Map(idSesión -> [cruces]) para marcar los bloques en conflicto.
export function crucesPorSesion(cruces = []) {
  const m = new Map()
  for (const c of cruces) {
    for (const id of c.sesiones) {
      if (!m.has(id)) m.set(id, [])
      m.get(id).push(c)
    }
  }
  return m
}

const fmtNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
export const fmtHoras = (n) => (n === null || n === undefined ? '—' : `${fmtNum(n)} h`)
