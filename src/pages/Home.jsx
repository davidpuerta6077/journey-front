import '../styles/global/Global.css'
import '../styles/global/Home.css'

import {
  Sparkline,
  MiniBars,
  LineChart,
  DonutChart,
  StackedBarChart,
} from '../components/charts'

/* ---------- Datos quemados (a futuro dinámicos por perfil) ---------- */
const tools = [
  { name: 'Nexo', icon: '🎓' },
  { name: 'Codex', icon: '🗂️' },
  { name: 'Visor', icon: '🧩' },
  { name: 'Nexo', icon: '🎓' },
  { name: 'Codex', icon: '🗂️' },
]

const alerts = Array.from({ length: 4 }, () => ({
  title: 'Lorem ipsum dolor sit amet',
  text: 'consectetur adipiscing elit',
}))

const enrollmentsTrend = [
  { label: 'Ene', value: 50 },
  { label: 'Feb', value: 105 },
  { label: 'Mar', value: 65 },
  { label: 'Abr', value: 110 },
  { label: 'May', value: 130 },
  { label: 'Jun', value: 108 },
  { label: 'Jul', value: 195 },
  { label: 'Ago', value: 150 },
  { label: 'Sep', value: 205 },
  { label: 'Oct', value: 155 },
  { label: 'Nov', value: 185 },
  { label: 'Dic', value: 220 },
]

const modality = [
  { label: 'Creado', value: 200, color: '#5b73c4' },
  { label: 'Presencial', value: 70, color: '#f9ec8f' },
  { label: 'Virtual', value: 75, color: '#2c3a6b' },
]

const facultySeries = [
  { key: 'created', label: 'Creados', color: '#5b73c4' },
  { key: 'review', label: 'Revisados', color: '#b8c3e6' },
  { key: 'progress', label: 'En proceso', color: '#f9ec8f' },
]

const facultyData = [
  { label: 'Ene', created: 25, review: 37, progress: 18 },
  { label: 'Feb', created: 40, review: 38, progress: 12 },
  { label: 'Mar', created: 25, review: 20, progress: 14 },
  { label: 'Abr', created: 47, review: 20, progress: 18 },
  { label: 'May', created: 20, review: 18, progress: 10 },
]

const totalTrend = [20, 35, 28, 40, 36, 52, 45, 60, 68, 75]
const semesterBars = [18, 30, 22, 38, 34, 42, 36, 46, 50, 60]
const coursesBars = [30, 20, 34, 15, 22, 28, 32, 40, 55, 45]

/* ---------- Componentes locales ---------- */
function KpiCard({ value, delta, children }) {
  return (
    <div className="hub-card hub-kpi-card">
      <div className="hub-kpi-info">
        <strong className="hub-kpi-value">{value}</strong>
        <span className="hub-kpi-delta">
          <b>▲ {delta}</b> vs mes anterior
        </span>
      </div>
      <div className="hub-kpi-chart">{children}</div>
    </div>
  )
}

/* ---------- Página ---------- */
export default function Home() {
  return (
    <div className="hub-home">
      <section className="hub-welcome">
        <h1>¡Hola David!</h1>
        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod</p>
      </section>

      <aside className="hub-alerts">
        <h2 className="hub-title">Alertas y notificaciones</h2>
        <ul className="hub-alert-list">
          {alerts.map((a, i) => (
            <li key={i} className="hub-alert-item">
              <span className="hub-alert-icon">🔔</span>
              <div>
                <strong>{a.title}</strong>
                <span>{a.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className="hub-tools">
        <h2 className="hub-title">Herramientas frecuentes</h2>
        <div className="hub-tools-row">
          {tools.map((t, i) => (
            <button key={i} type="button" className="hub-card hub-tool-card">
              <span className="hub-tool-icon">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="hub-kpi">
        <h2 className="hub-title">Total estudiantes matriculados</h2>
        <KpiCard value="14.580" delta="3.2%">
          <Sparkline data={totalTrend} />
        </KpiCard>
      </section>

      <section className="hub-kpi">
        <h2 className="hub-title">Matrículas del semestre 2026-1</h2>
        <KpiCard value="1.250" delta="1.5%">
          <MiniBars data={semesterBars} max={70} />
        </KpiCard>
      </section>

      <section className="hub-kpi">
        <h2 className="hub-title">Cursos activos en Moodle</h2>
        <KpiCard value="345" delta="4.1%">
          <MiniBars data={coursesBars} max={70} />
        </KpiCard>
      </section>

      <section className="hub-trend">
        <h2 className="hub-title">Tendencia de matrículas (año actual)</h2>
        <div className="hub-card hub-chart-card">
          <LineChart data={enrollmentsTrend} highlightIndex={6} highlightText="Lorem ipsum" />
        </div>
      </section>

      <section className="hub-modality">
        <h2 className="hub-title">Distribución por modalidad</h2>
        <div className="hub-card hub-chart-card">
          <p className="hub-chart-sub">(Presencial vs. virtual)</p>
          <DonutChart segments={modality} />
        </div>
      </section>

      <section className="hub-faculty">
        <h2 className="hub-title">Cursos por facultad</h2>
        <div className="hub-card hub-chart-card">
          <p className="hub-chart-sub">(Gráfico de barras apiladas)</p>
          <StackedBarChart data={facultyData} series={facultySeries} />
        </div>
      </section>
    </div>
  )
}
