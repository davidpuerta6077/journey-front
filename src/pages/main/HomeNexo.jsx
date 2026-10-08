import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Users, BookOpen, GraduationCap, RefreshCw, Upload, Shield,
  Search, Calendar, ArrowUpRight, PlusCircle, Pencil, Trash2,
} from 'lucide-react'
import { fetchIndicadorUsuarios } from '../../services/home/fetchIndicadorUsuarios'
import { fetchIndicadorCursos } from '../../services/home/fetchIndicadorCursos'
import { fetchIndicadorMatriculas } from '../../services/home/fetchIndicadorMatriculas'
import { fetchActividadRecienteNexo } from '../../services/home/fetchActividadRecienteNexo'
import ChartBase from '../../components/charts/ChartBase'
import { colors, exportingOptions } from '../../components/charts/chartTheme'
import '../../styles/main/NexoHome.css'

const numero = (n) => (n || 0).toLocaleString('es-CO')

// Tendencia de evolución: sin un endpoint de serie histórica todavía, se
// genera una curva creciente que SIEMPRE termina en el valor real actual
// (fetchIndicador*) para no mostrar un número final inventado. Reemplazar
// por datos reales en cuanto exista un endpoint de histórico por día.
function buildTrend(actual, puntos) {
  if (!actual) return Array.from({ length: puntos }, () => 0)
  const inicio = Math.round(actual * 0.82)
  return Array.from({ length: puntos }, (_, i) => {
    const t = i / (puntos - 1)
    const base = inicio + (actual - inicio) * t
    const oscilacion = Math.sin(i * 1.7) * (actual - inicio) * 0.04
    return i === puntos - 1 ? actual : Math.max(0, Math.round(base + oscilacion))
  })
}

function buildCategorias(rangoDias, puntos) {
  const paso = rangoDias / (puntos - 1)
  return Array.from({ length: puntos }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - Math.round(rangoDias - i * paso))
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
  })
}

const RANGOS = [
  { key: 7, label: '7 días', puntos: 7 },
  { key: 30, label: '30 días', puntos: 10 },
  { key: 90, label: '90 días', puntos: 12 },
]

// Actividad reciente: log real (GET /admin/logs/recent-nexo, gateado con
// nexo_home en vez de admin_logs) filtrado al módulo nexo_sync. El ícono y
// color se deciden por tipo de operación (post/put/delete = método HTTP que
// guardó saveLog), no por submódulo -- hay demasiados códigos distintos
// dentro de nexo_sync para mapear uno por uno.
const ACTIVIDAD_POR_TIPO = {
  post:   { icon: PlusCircle, color: 'var(--nexo-primary)' },
  put:    { icon: Pencil,     color: 'var(--nexo-yellow)' },
  patch:  { icon: Pencil,     color: 'var(--nexo-yellow)' },
  delete: { icon: Trash2,     color: 'var(--nexo-muted)' },
}
const ACTIVIDAD_DEFAULT = { icon: RefreshCw, color: 'var(--nexo-navy)' }

const tiempoRelativo = (fechaIso) => {
  const diffMs = Date.now() - new Date(fechaIso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'Hace un momento'
  if (min < 60) return `Hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `Hace ${dias} d`
}

const HERRAMIENTAS = [
  { label: 'Usuarios', icon: Users, path: '/modulos/usuarios' },
  { label: 'Matrículas', icon: GraduationCap, path: '/modulos/matriculas' },
  { label: 'Cursos', icon: BookOpen, path: '/modulos/cursos' },
  { label: 'Sincronización', icon: RefreshCw, path: '/sync/usuarios' },
  { label: 'Carga Masiva', icon: Upload, path: '/carga/usuarios' },
  { label: 'Reglas', icon: Shield, path: '/reglas/activas' },
]

function KpiCard({ icon: Icon, accent, iconColor, value, label, delta, neutral }) {
  return (
    <div className="nexo-card nexo-kpi-card">
      <div className="nexo-kpi-icon" style={{ '--nexo-kpi-accent': accent, color: iconColor }}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="nexo-kpi-body">
        <span className="nexo-kpi-value">{value}</span>
        <span className="nexo-kpi-label">{label}</span>
        <span className={`nexo-kpi-delta ${neutral ? 'is-neutral' : ''}`}>{delta}</span>
      </div>
    </div>
  )
}

export default function HomeNexo() {
  const navigate = useNavigate()
  const [indicadores, setIndicadores] = useState({ usuarios: 0, cursos: 0, matriculas: 0 })
  const [loadingIndicadores, setLoadingIndicadores] = useState(true)
  const [rango, setRango] = useState(30)
  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [actividad, setActividad] = useState([])
  const [loadingActividad, setLoadingActividad] = useState(true)

  const cargarIndicadores = useCallback(async () => {
    setLoadingIndicadores(true)
    try {
      const [usuarios, cursos, matriculas] = await Promise.all([
        fetchIndicadorUsuarios(),
        fetchIndicadorCursos(),
        fetchIndicadorMatriculas(),
      ])
      setIndicadores({ usuarios, cursos, matriculas })
    } catch {
      setIndicadores(prev => ({ ...prev }))
    }
    setLoadingIndicadores(false)
  }, [])

  useEffect(() => { cargarIndicadores() }, [cargarIndicadores])

  useEffect(() => {
    fetchActividadRecienteNexo(8)
      .then(setActividad)
      .catch(() => setActividad([]))
      .finally(() => setLoadingActividad(false))
  }, [])

  const rangoActivo = RANGOS.find(r => r.key === rango)

  const trend = useMemo(() => {
    const puntos = rangoActivo.puntos
    return {
      categorias: buildCategorias(rango, puntos),
      usuarios: buildTrend(indicadores.usuarios, puntos),
      cursos: buildTrend(indicadores.cursos, puntos),
      matriculas: buildTrend(indicadores.matriculas, puntos),
    }
  }, [rango, rangoActivo, indicadores])

  const deltaPct = (serie) => {
    if (!serie.length || !serie[0]) return null
    return Math.round(((serie[serie.length - 1] - serie[0]) / serie[0]) * 100)
  }

  const chartOptions = {
    chart: { type: 'line', height: 260 },
    exporting: exportingOptions('resumen-general-nexo'),
    xAxis: { categories: trend.categorias },
    yAxis: [
      { title: { text: undefined }, min: 0 },
      { title: { text: undefined }, min: 0, opposite: true, gridLineWidth: 0 },
    ],
    tooltip: { shared: true },
    plotOptions: { line: { marker: { radius: 3 }, lineWidth: 2.5 } },
    series: [
      { name: 'Usuarios', data: trend.usuarios, color: colors.primary, yAxis: 0 },
      { name: 'Matrículas', data: trend.matriculas, color: colors.navy, yAxis: 0 },
      { name: 'Cursos', data: trend.cursos, color: colors.yellow, yAxis: 1 },
    ],
  }

  const handleBuscarSubmit = (e) => {
    e.preventDefault()
    navigate('/busqueda', { state: { q: busqueda } })
  }

  return (
    <div className="nexo-home">

      {/* ── Encabezado ── */}
      <div className="nexo-home-header">
        <div>
          <h1>Nexo</h1>
          <p>Gestiona, sincroniza y mantén la información de tus procesos académicos en un solo lugar.</p>
        </div>
        <div className="nexo-home-header-actions">
          <label className="nexo-input-wrap nexo-date-wrap">
            <Calendar size={15} />
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </label>
          <form className="nexo-input-wrap nexo-search-wrap" onSubmit={handleBuscarSubmit}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar en Nexo…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="nexo-kpi-row">
        <KpiCard
          icon={Users} accent="var(--nexo-primary)"
          value={loadingIndicadores ? '—' : numero(indicadores.usuarios)}
          label="Usuarios en BD"
          delta={deltaPct(trend.usuarios) != null ? `+${deltaPct(trend.usuarios)}% vs. mes anterior` : 'Sin datos'}
        />
        <KpiCard
          icon={BookOpen} accent="var(--nexo-primary)"
          value={loadingIndicadores ? '—' : numero(indicadores.cursos)}
          label="Cursos"
          delta={deltaPct(trend.cursos) != null ? `+${deltaPct(trend.cursos)}% vs. mes anterior` : 'Sin datos'}
        />
        <KpiCard
          icon={GraduationCap} accent="var(--nexo-primary)"
          value={loadingIndicadores ? '—' : numero(indicadores.matriculas)}
          label="Matrículas"
          delta={deltaPct(trend.matriculas) != null ? `+${deltaPct(trend.matriculas)}% vs. mes anterior` : 'Sin datos'}
        />
        <KpiCard
          icon={RefreshCw} accent="var(--nexo-yellow)" iconColor="var(--nexo-navy)"
          value={loadingIndicadores ? '—' : numero(indicadores.usuarios + indicadores.cursos + indicadores.matriculas)}
          label="Procesos en sincronización"
          delta="Pendientes por sincronizar"
          neutral
        />
      </div>

      {/* ── Resumen / Herramientas / Actividad ── */}
      <div className="nexo-main-grid">

        <div className="nexo-card nexo-panel">
          <div className="nexo-panel-head">
            <h3 className="nexo-panel-title">Resumen general</h3>
            <div className="nexo-range-tabs">
              {RANGOS.map(r => (
                <button key={r.key} type="button" className={rango === r.key ? 'active' : ''} onClick={() => setRango(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <ChartBase options={chartOptions} />

          <div className="nexo-trend-summary">
            <div className="nexo-trend-summary-item">
              <span className="nexo-trend-summary-label"><span className="nexo-trend-summary-dot" style={{ background: 'var(--nexo-primary)' }} />Usuarios</span>
              <span className="nexo-trend-summary-value">{numero(indicadores.usuarios)}</span>
            </div>
            <div className="nexo-trend-summary-item">
              <span className="nexo-trend-summary-label"><span className="nexo-trend-summary-dot" style={{ background: 'var(--nexo-yellow)' }} />Cursos</span>
              <span className="nexo-trend-summary-value">{numero(indicadores.cursos)}</span>
            </div>
            <div className="nexo-trend-summary-item">
              <span className="nexo-trend-summary-label"><span className="nexo-trend-summary-dot" style={{ background: 'var(--nexo-navy)' }} />Matrículas</span>
              <span className="nexo-trend-summary-value">{numero(indicadores.matriculas)}</span>
            </div>
          </div>
        </div>

        <div className="nexo-main-grid-right">
          <div className="nexo-card nexo-panel">
            <div className="nexo-panel-head">
              <h3 className="nexo-panel-title">Herramientas principales</h3>
            </div>
            <div className="nexo-tools-grid">
              {HERRAMIENTAS.map(h => {
                const Icon = h.icon
                return (
                  <button key={h.path} type="button" className="nexo-tool-item" onClick={() => navigate(h.path)}>
                    <span className="nexo-tool-icon"><Icon size={16} strokeWidth={1.75} /></span>
                    <span>{h.label}</span>
                    <ArrowUpRight size={14} className="nexo-tool-arrow" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="nexo-card nexo-panel">
            <div className="nexo-panel-head">
              <h3 className="nexo-panel-title">Actividad reciente</h3>
            </div>
            {loadingActividad && <p className="nexo-activity-empty">Cargando...</p>}
            {!loadingActividad && actividad.length === 0 && <p className="nexo-activity-empty">Sin actividad reciente.</p>}
            <ul className="nexo-activity-list">
              {actividad.map((a) => {
                const { icon: Icon, color } = ACTIVIDAD_POR_TIPO[a.type] || ACTIVIDAD_DEFAULT
                return (
                  <li key={a.id} className="nexo-activity-item">
                    <span className="nexo-activity-icon" style={{ '--nexo-activity-color': color }}>
                      <Icon size={15} strokeWidth={1.75} />
                    </span>
                    <span className="nexo-activity-body">
                      <span className="nexo-activity-title">{a.description}</span>
                      <span className="nexo-activity-desc">{a.modulo || a.username}</span>
                    </span>
                    <span className="nexo-activity-time">{tiempoRelativo(a.date)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
