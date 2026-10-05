import BarChartCard from '../../../components/charts/BarChartCard'
import DonutChartCard from '../../../components/charts/DonutChartCard'
import { STATUS } from '../../../components/charts/palette'
import { numOr0 } from './dashboardHelpers'

// ─── helpers ────────────────────────────────────────────────────────────────
const sum = (rows, k) => rows.reduce((a, r) => a + numOr0(r[k]), 0)
const avg = (rows, k) => (rows.length ? sum(rows, k) / rows.length : 0)
const round = (n, d = 1) => Number(Number(n).toFixed(d))
const has = (cols, key) => cols.some((c) => c.key === key)
const topN = (rows, k, n = 15) => [...rows].sort((a, b) => numOr0(b[k]) - numOr0(a[k])).slice(0, n)
const esVerdadero = (v) => v === true || v === 'true'

// KPI que al hacer clic filtra el detalle a las filas que cumplen `fn`.
const kpiFiltro = (ctx, kpi, fn) => ({ ...kpi, onClick: ctx.filtrar(kpi.label, fn), filtroLabel: kpi.label })

// Agrupa filas por una clave sumando otra. Si valueKey es null, cuenta filas.
function agrupar(rows, nameKey, valueKey) {
  const m = new Map()
  for (const r of rows) {
    const k = r[nameKey] ?? '(sin valor)'
    m.set(k, (m.get(k) || 0) + (valueKey ? numOr0(r[valueKey]) : 1))
  }
  return [...m.entries()].map(([k, v]) => ({ [nameKey]: k, valor: v }))
}

const BUCKETS_INACTIVIDAD = [1, 7, 30, 90]

// Etiqueta del rango de días al que pertenece un valor (misma regla que el histograma).
function rangoDe(v, buckets = BUCKETS_INACTIVIDAD) {
  if (v == null) return 'nunca'
  const n = numOr0(v)
  let prev = 0
  for (const b of buckets) {
    if (n <= b) return `${prev + 1}–${b}`
    prev = b
  }
  return `${prev + 1}+`
}

function histograma(rows, key, buckets = BUCKETS_INACTIVIDAD) {
  const labels = []
  let prev = 0
  for (const b of buckets) { labels.push(`${prev + 1}–${b}`); prev = b }
  labels.push(`${prev + 1}+`)
  labels.push('nunca')
  const cuenta = new Map(labels.map((l) => [l, 0]))
  for (const r of rows) cuenta.set(rangoDe(r[key], buckets), cuenta.get(rangoDe(r[key], buckets)) + 1)
  return labels.map((rango) => ({ rango, estudiantes: cuenta.get(rango) }))
}

function riesgo({ rows }, ctx) {
  const key = 'dias_inactivo'
  const nunca = rows.filter((r) => r[key] == null).length
  const conDias = rows.filter((r) => r[key] != null)
  return {
    kpis: [
      { label: 'Estudiantes en riesgo', value: rows.length, accent: STATUS.warn },
      kpiFiltro(ctx, { label: 'Nunca accedieron', value: nunca, accent: STATUS.error }, (r) => r[key] == null),
      { label: 'Días inactivo (prom.)', value: conDias.length ? round(avg(conDias, key)) : '—' },
    ],
    charts: [
      <BarChartCard key="h" title="Distribución de días de inactividad"
        data={histograma(rows, key)} xKey="rango"
        series={[{ key: 'estudiantes', label: 'Estudiantes' }]}
        onSelect={(rango) => ctx.filtrar(`Días inactivo: ${rango}`, (r) => rangoDe(r[key]) === rango)()} />,
    ],
  }
}

// ─── overrides por tipo ─────────────────────────────────────────────────────
// (resultado, ctx) => { kpis: [{label,value,hint,accent,onClick}], charts: [ReactNode] }
// ctx.drill(key)(valor) filtra el detalle por una columna; ctx.filtrar(label, fn)
// devuelve un onClick que filtra el detalle con una condición propia.
const D = {
  journey_courses_by_sync_status: ({ rows }, ctx) => ({
    kpis: [
      { label: 'Cursos totales', value: sum(rows, 'cantidad') },
      kpiFiltro(ctx, { label: 'Con error', value: sum(rows.filter((r) => r.estado === 'error'), 'cantidad'), accent: STATUS.error }, (r) => r.estado === 'error'),
    ],
    charts: [<DonutChartCard key="d" title="Cursos por estado de sincronización" data={rows} nameKey="estado" valueKey="cantidad" onSelect={ctx.drill('estado')} />],
  }),

  journey_enrollments_by_status: ({ rows }, ctx) => {
    const porEstado = agrupar(rows, 'estado', 'cantidad')
    const total = sum(rows, 'cantidad')
    const sinc = sum(rows.filter((r) => esVerdadero(r.sincronizado)), 'cantidad')
    return {
      kpis: [
        { label: 'Matrículas totales', value: total },
        kpiFiltro(ctx, { label: 'Sincronizadas', value: sinc, hint: total ? `${round((sinc / total) * 100)}%` : null, accent: STATUS.ok }, (r) => esVerdadero(r.sincronizado)),
        kpiFiltro(ctx, { label: 'Pendientes de sincronizar', value: total - sinc, accent: STATUS.warn }, (r) => !esVerdadero(r.sincronizado)),
      ],
      charts: [<DonutChartCard key="d" title="Matrículas por estado" data={porEstado} nameKey="estado" valueKey="valor" onSelect={ctx.drill('estado')} />],
    }
  },

  journey_audit_activity: ({ columns, rows }, ctx) => {
    const total = sum(rows, 'acciones')
    if (has(columns, 'dia')) {
      const cron = [...rows].sort((a, b) => String(a.dia).localeCompare(String(b.dia)))
      return {
        kpis: [{ label: 'Acciones', value: total }, { label: 'Días con actividad', value: rows.length }],
        charts: [<BarChartCard key="b" title="Acciones por día" data={cron} xKey="dia" series={[{ key: 'acciones', label: 'Acciones' }]} onSelect={ctx.drill('dia')} />],
      }
    }
    const dimKey = has(columns, 'usuario') ? 'usuario' : 'modulo'
    const top = topN(rows, 'acciones')
    return {
      kpis: [{ label: 'Acciones', value: total }, { label: dimKey === 'usuario' ? 'Usuarios activos' : 'Módulos', value: rows.length }],
      charts: [<BarChartCard key="b" title={`Acciones por ${dimKey}`} data={top} xKey={dimKey} series={[{ key: 'acciones', label: 'Acciones' }]} orientation="y" height={Math.max(240, top.length * 28)} onSelect={ctx.drill(dimKey)} />],
    }
  },

  journey_virtual_labs_grades: ({ columns, rows }, ctx) => {
    if (has(columns, 'id_curso') && has(columns, 'promedio')) {
      return {
        kpis: [
          { label: 'Cursos con notas', value: rows.length },
          { label: 'Calificaciones', value: sum(rows, 'calificaciones') },
          { label: 'Promedio global', value: round(avg(rows, 'promedio'), 2) },
        ],
        charts: [<BarChartCard key="b" title="Promedio por curso" data={rows} xKey="id_curso" series={[{ key: 'promedio', label: 'Promedio' }]} onSelect={ctx.drill('id_curso')} />],
      }
    }
    if (has(columns, 'id_estudiante')) {
      const top = topN(rows, 'promedio')
      return {
        kpis: [{ label: 'Estudiantes', value: rows.length }, { label: 'Promedio global', value: round(avg(rows, 'promedio'), 2) }],
        charts: [<BarChartCard key="b" title="Promedio por estudiante (top 15)" data={top} xKey="correo" series={[{ key: 'promedio', label: 'Promedio' }]} orientation="y" height={Math.max(240, top.length * 28)} onSelect={ctx.drill('correo')} />],
      }
    }
    return { kpis: [{ label: 'Registros', value: rows.length }], charts: [] }
  },

  journey_platform_users_by_role: ({ rows }, ctx) => ({
    kpis: [
      { label: 'Usuarios de plataforma', value: sum(rows, 'usuarios') },
      kpiFiltro(ctx, { label: 'Activos', value: sum(rows, 'activos'), accent: STATUS.ok }, (r) => r.activo === 'Activo'),
      kpiFiltro(ctx, { label: 'Nunca han ingresado', value: sum(rows, 'usuarios') - sum(rows, 'con_ingreso'), accent: STATUS.warn }, (r) => r.last_login == null),
    ],
    charts: [<BarChartCard key="b" title="Usuarios por rol" data={rows} xKey="rol" series={[{ key: 'usuarios', label: 'Usuarios' }, { key: 'activos', label: 'Activos' }]} onSelect={ctx.drill('rol')} />],
  }),

  journey_sync_rules: ({ rows }, ctx) => {
    const top = topN(rows, 'cursos_asociados')
    return {
      kpis: [
        { label: 'Reglas', value: rows.length },
        kpiFiltro(ctx, { label: 'Activas', value: rows.filter((r) => esVerdadero(r.activo)).length, accent: STATUS.ok }, (r) => esVerdadero(r.activo)),
        { label: 'Cursos cubiertos', value: sum(rows, 'cursos_asociados') },
      ],
      charts: [<BarChartCard key="b" title="Cursos asociados por regla (top 15)" data={top} xKey="seed_shortname" series={[{ key: 'cursos_asociados', label: 'Cursos' }]} orientation="y" height={Math.max(240, top.length * 28)} onSelect={ctx.drill('seed_shortname')} />],
    }
  },

  journey_permissions_matrix: ({ rows }, ctx) => ({
    kpis: [
      { label: 'Permisos', value: rows.length },
      { label: 'Roles', value: new Set(rows.map((r) => r.rol)).size },
      { label: 'Submódulos', value: new Set(rows.map((r) => r.submodulo)).size },
    ],
    charts: [<BarChartCard key="b" title="Permisos por rol" data={agrupar(rows, 'rol', null)} xKey="rol" series={[{ key: 'valor', label: 'Permisos' }]} orientation="y" onSelect={ctx.drill('rol')} />],
  }),

  moodle_courses_by_category: ({ rows }, ctx) => ({
    kpis: [
      { label: 'Categorías', value: rows.length },
      { label: 'Cursos', value: sum(rows, 'cursos') },
      { label: 'Estudiantes', value: rows.some((r) => r.estudiantes == null) ? '—' : sum(rows, 'estudiantes') },
    ],
    charts: [<BarChartCard key="b" title="Cursos y estudiantes por categoría" data={rows} xKey="categoria" series={[{ key: 'cursos', label: 'Cursos' }, { key: 'estudiantes', label: 'Estudiantes' }]} onSelect={ctx.drill('categoria')} />],
  }),

  moodle_enrollment_by_course: ({ rows }, ctx) => {
    const top = topN(rows, 'total', 20)
    const sinConteo = rows.some((r) => r.total == null)
    return {
      kpis: [
        { label: 'Cursos', value: rows.length },
        { label: 'Matriculados', value: sinConteo ? '—' : sum(rows, 'total') },
        { label: 'Promedio por curso', value: sinConteo ? '—' : round(avg(rows, 'total'), 1) },
        kpiFiltro(ctx, { label: 'Sin profesor', value: rows.filter((r) => r.profesores === 0).length, accent: STATUS.warn }, (r) => r.profesores === 0),
      ],
      charts: [<BarChartCard key="b" title="Matriculados por curso (top 20)" data={top} xKey="curso" series={[{ key: 'estudiantes', label: 'Estudiantes' }, { key: 'profesores', label: 'Profesores' }]} stacked orientation="y" height={Math.max(280, top.length * 26)} onSelect={ctx.drill('curso')} />],
    }
  },

  sync_discrepancies: ({ rows }, ctx) => ({
    kpis: [{ label: 'Discrepancias', value: rows.length, accent: STATUS.error }],
    charts: [<DonutChartCard key="d" title="Discrepancias por tipo" data={agrupar(rows, 'tipo', null)} nameKey="tipo" valueKey="valor" onSelect={ctx.drill('tipo')} />],
  }),

  enrollment_moodle_vs_journey: ({ rows }, ctx) => {
    const r = rows[0] || {}
    return {
      kpis: [
        { label: 'En Nexo', value: numOr0(r.en_journey) },
        { label: 'En Moodle', value: r.en_moodle == null ? '—' : numOr0(r.en_moodle) },
        kpiFiltro(ctx, { label: 'Solo en Nexo', value: numOr0(r.solo_nexo), accent: numOr0(r.solo_nexo) ? STATUS.warn : STATUS.ok }, (d) => d.situacion === 'Solo en Nexo'),
        kpiFiltro(ctx, { label: 'Solo en Moodle', value: numOr0(r.solo_moodle), accent: numOr0(r.solo_moodle) ? STATUS.warn : STATUS.ok }, (d) => d.situacion === 'Solo en Moodle'),
      ],
      charts: [],
    }
  },

  moodle_students_at_risk_platform: riesgo,
  moodle_students_at_risk_course: riesgo,
}

export function dashboardParaTipo(tipo, resultado, ctx) {
  const fn = D[tipo]
  if (!fn) return null
  try {
    return fn(resultado, ctx)
  } catch (e) {
    console.error('dashboard override falló para', tipo, e)
    return null
  }
}
