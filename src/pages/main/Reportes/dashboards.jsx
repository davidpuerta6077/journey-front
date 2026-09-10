import BarChartCard from '../../../components/charts/BarChartCard'
import LineChartCard from '../../../components/charts/LineChartCard'
import DonutChartCard from '../../../components/charts/DonutChartCard'
import { STATUS } from '../../../components/charts/palette'

// ─── helpers ────────────────────────────────────────────────────────────────
const num = (v) => (typeof v === 'number' ? v : Number(v)) || 0
const sum = (rows, k) => rows.reduce((a, r) => a + num(r[k]), 0)
const avg = (rows, k) => (rows.length ? sum(rows, k) / rows.length : 0)
const round = (n, d = 1) => Number(Number(n).toFixed(d))
const has = (cols, key) => cols.some((c) => c.key === key)
const topN = (rows, k, n = 15) => [...rows].sort((a, b) => num(b[k]) - num(a[k])).slice(0, n)
const esVerdadero = (v) => v === true || v === 'true'

// Agrupa filas por una clave sumando otra. Si valueKey es null, cuenta filas.
function agrupar(rows, nameKey, valueKey) {
  const m = new Map()
  for (const r of rows) {
    const k = r[nameKey] ?? '(sin valor)'
    m.set(k, (m.get(k) || 0) + (valueKey ? num(r[valueKey]) : 1))
  }
  return [...m.entries()].map(([k, v]) => ({ [nameKey]: k, valor: v }))
}

function histograma(rows, key, buckets = [1, 7, 30, 90]) {
  const labels = []
  let prev = 0
  for (const b of buckets) { labels.push(`${prev + 1}–${b}`); prev = b }
  labels.push(`${prev + 1}+`)
  labels.push('nunca')
  const bins = new Array(labels.length).fill(0)
  for (const r of rows) {
    const v = r[key]
    if (v == null) { bins[bins.length - 1]++; continue }
    const n = num(v)
    let idx = buckets.findIndex((b) => n <= b)
    if (idx === -1) idx = buckets.length
    bins[idx]++
  }
  return labels.map((rango, i) => ({ rango, estudiantes: bins[i] }))
}

function riesgo({ rows }) {
  const key = 'dias_inactivo'
  const nunca = rows.filter((r) => r[key] == null).length
  const conDias = rows.filter((r) => r[key] != null)
  return {
    kpis: [
      { label: 'Estudiantes en riesgo', value: rows.length, accent: STATUS.warn },
      { label: 'Nunca accedieron', value: nunca, accent: STATUS.error },
      { label: 'Días inactivo (prom.)', value: conDias.length ? round(avg(conDias, key)) : '—' },
    ],
    charts: [
      <BarChartCard key="h" title="Distribución de días de inactividad"
        data={histograma(rows, key)} xKey="rango"
        series={[{ key: 'estudiantes', label: 'Estudiantes' }]} />,
    ],
  }
}

// ─── overrides por tipo ─────────────────────────────────────────────────────
// (resultado) => { kpis: [{label,value,hint,accent}], charts: [ReactNode] }
const D = {
  journey_courses_by_sync_status: ({ rows }) => ({
    kpis: [{ label: 'Cursos totales', value: sum(rows, 'cantidad') }],
    charts: [<DonutChartCard key="d" title="Cursos por estado de sincronización" data={rows} nameKey="estado" valueKey="cantidad" />],
  }),

  journey_enrollments_by_status: ({ rows }) => {
    const porEstado = agrupar(rows, 'estado', 'cantidad')
    const total = sum(rows, 'cantidad')
    const sinc = sum(rows.filter((r) => esVerdadero(r.sincronizado)), 'cantidad')
    return {
      kpis: [
        { label: 'Matrículas totales', value: total },
        { label: 'Sincronizadas', value: sinc, hint: total ? `${round((sinc / total) * 100)}%` : null, accent: STATUS.ok },
      ],
      charts: [<DonutChartCard key="d" title="Matrículas por estado" data={porEstado} nameKey="estado" valueKey="valor" />],
    }
  },

  journey_audit_activity: ({ columns, rows }) => {
    const total = sum(rows, 'acciones')
    if (has(columns, 'dia')) {
      const cron = [...rows].sort((a, b) => String(a.dia).localeCompare(String(b.dia)))
      return {
        kpis: [{ label: 'Acciones', value: total }, { label: 'Días con actividad', value: rows.length }],
        charts: [<LineChartCard key="l" title="Acciones por día" data={cron} xKey="dia" series={[{ key: 'acciones', label: 'Acciones' }]} />],
      }
    }
    const dimKey = has(columns, 'usuario') ? 'usuario' : 'modulo'
    const top = topN(rows, 'acciones')
    return {
      kpis: [{ label: 'Acciones', value: total }, { label: dimKey === 'usuario' ? 'Usuarios activos' : 'Módulos', value: rows.length }],
      charts: [<BarChartCard key="b" title={`Acciones por ${dimKey}`} data={top} xKey={dimKey} series={[{ key: 'acciones', label: 'Acciones' }]} orientation="y" height={Math.max(240, top.length * 28)} />],
    }
  },

  journey_virtual_labs_grades: ({ columns, rows }) => {
    if (has(columns, 'id_curso') && has(columns, 'promedio')) {
      return {
        kpis: [
          { label: 'Cursos con notas', value: rows.length },
          { label: 'Calificaciones', value: sum(rows, 'calificaciones') },
          { label: 'Promedio global', value: round(avg(rows, 'promedio'), 2) },
        ],
        charts: [<BarChartCard key="b" title="Promedio por curso" data={rows} xKey="id_curso" series={[{ key: 'promedio', label: 'Promedio' }]} />],
      }
    }
    if (has(columns, 'id_estudiante')) {
      const top = topN(rows, 'promedio')
      return {
        kpis: [{ label: 'Estudiantes', value: rows.length }, { label: 'Promedio global', value: round(avg(rows, 'promedio'), 2) }],
        charts: [<BarChartCard key="b" title="Promedio por estudiante (top 15)" data={top} xKey="correo" series={[{ key: 'promedio', label: 'Promedio' }]} orientation="y" height={Math.max(240, top.length * 28)} />],
      }
    }
    return { kpis: [{ label: 'Registros', value: rows.length }], charts: [] }
  },

  journey_platform_users_by_role: ({ rows }) => ({
    kpis: [
      { label: 'Usuarios de plataforma', value: sum(rows, 'usuarios') },
      { label: 'Activos', value: sum(rows, 'activos'), accent: STATUS.ok },
    ],
    charts: [<BarChartCard key="b" title="Usuarios por rol" data={rows} xKey="rol" series={[{ key: 'usuarios', label: 'Usuarios' }, { key: 'activos', label: 'Activos' }]} />],
  }),

  journey_sync_rules: ({ rows }) => {
    const top = topN(rows, 'cursos_asociados')
    return {
      kpis: [
        { label: 'Reglas', value: rows.length },
        { label: 'Activas', value: rows.filter((r) => esVerdadero(r.activo)).length, accent: STATUS.ok },
        { label: 'Cursos cubiertos', value: sum(rows, 'cursos_asociados') },
      ],
      charts: [<BarChartCard key="b" title="Cursos asociados por regla (top 15)" data={top} xKey="seed_shortname" series={[{ key: 'cursos_asociados', label: 'Cursos' }]} orientation="y" height={Math.max(240, top.length * 28)} />],
    }
  },

  journey_permissions_matrix: ({ rows }) => ({
    kpis: [
      { label: 'Permisos', value: rows.length },
      { label: 'Roles', value: new Set(rows.map((r) => r.rol)).size },
      { label: 'Submódulos', value: new Set(rows.map((r) => r.submodulo)).size },
    ],
    charts: [<BarChartCard key="b" title="Permisos por rol" data={agrupar(rows, 'rol', null)} xKey="rol" series={[{ key: 'valor', label: 'Permisos' }]} orientation="y" />],
  }),

  moodle_courses_by_category: ({ rows }) => ({
    kpis: [
      { label: 'Categorías', value: rows.length },
      { label: 'Cursos', value: sum(rows, 'cursos') },
      { label: 'Estudiantes', value: sum(rows, 'estudiantes') },
    ],
    charts: [<BarChartCard key="b" title="Cursos y estudiantes por categoría" data={rows} xKey="categoria" series={[{ key: 'cursos', label: 'Cursos' }, { key: 'estudiantes', label: 'Estudiantes' }]} />],
  }),

  moodle_enrollment_by_course: ({ rows }) => {
    const top = topN(rows, 'total', 20)
    return {
      kpis: [
        { label: 'Cursos', value: rows.length },
        { label: 'Matriculados', value: sum(rows, 'total') },
        { label: 'Promedio por curso', value: round(avg(rows, 'total'), 1) },
      ],
      charts: [<BarChartCard key="b" title="Matriculados por curso (top 20)" data={top} xKey="curso" series={[{ key: 'estudiantes', label: 'Estudiantes' }, { key: 'profesores', label: 'Profesores' }]} stacked orientation="y" height={Math.max(280, top.length * 26)} />],
    }
  },

  sync_discrepancies: ({ rows }) => ({
    kpis: [{ label: 'Discrepancias', value: rows.length, accent: STATUS.error }],
    charts: [<DonutChartCard key="d" title="Discrepancias por tipo" data={agrupar(rows, 'tipo', null)} nameKey="tipo" valueKey="valor" />],
  }),

  enrollment_moodle_vs_journey: ({ rows }) => {
    const r = rows[0] || {}
    return {
      kpis: [
        { label: 'En Journey', value: num(r.en_journey) },
        { label: 'En Moodle', value: r.en_moodle == null ? '—' : num(r.en_moodle) },
        { label: 'Diferencia', value: r.diferencia == null ? '—' : num(r.diferencia), accent: num(r.diferencia) === 0 ? STATUS.ok : STATUS.warn },
      ],
      charts: [],
    }
  },

  moodle_students_at_risk_platform: riesgo,
  moodle_students_at_risk_course: riesgo,
}

export function dashboardParaTipo(tipo, resultado) {
  const fn = D[tipo]
  if (!fn) return null
  try {
    return fn(resultado)
  } catch (e) {
    console.error('dashboard override falló para', tipo, e)
    return null
  }
}
