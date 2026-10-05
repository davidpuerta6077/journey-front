<<<<<<< HEAD
=======
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../services/PermissionsContext'
>>>>>>> c5c2133de63dd7020c854abdacb0f8a9ae6800b5
import '../styles/global/Global.css'
import '../styles/global/Home.css'

<<<<<<< HEAD
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
=======
const services = [
  {
    name: 'Nexo',
    description: 'Sincronización de usuarios, cursos y matrículas con Moodle',
    icon: '⚡',
    color: '#3b82f6',
    path: '/HomeNexo',
    internal: true,
    moduleCode: 'nexo_sync',
  },
  {
    name: 'Administrador',
    description: 'Gestión de usuarios, roles, módulos y permisos de Bravo Hub',
    icon: '🛡️',
    color: '#0ea5e9',
    path: '/admin/usuarios',
    internal: true,
    moduleCode: 'admin',
  },
  {
    name: 'Centro de Soporte',
    description: 'Gestión de tickets y soporte técnico institucional',
    icon: '🎧',
    color: '#8b5cf6',
    href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php',
    moduleCode: 'support_center',
    submoduleCode: 'access',
  },
  {
    name: 'Hub',
    description: 'Portal centralizado de recursos y herramientas',
    icon: '🌐',
    color: '#06b6d4',
    href: 'https://hub.pascualbravovirtual.edu.co/login',
    moduleCode: 'hub',
    submoduleCode: 'access',
  },
  {
    name: 'Visor',
    description: 'Sistema de seguimiento y monitoreo académico',
    icon: '👁️',
    color: '#10b981',
    href: 'https://seguimiento.pascualbravovirtual.edu.co/',
    moduleCode: 'visor',
    submoduleCode: 'access',
  },
  {
    name: 'Matomo',
    description: 'Analítica web y seguimiento de usuarios',
    icon: '📈',
    color: '#f59e0b',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
  {
    name: 'Zabbix',
    description: 'Monitoreo de infraestructura y servidores',
    icon: '🖥️',
    color: '#ef4444',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
  {
    name: 'Bebras',
    description: 'Plataforma de pensamiento computacional',
    icon: '🦫',
    color: '#84cc16',
    href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/',
    moduleCode: 'bebras',
    submoduleCode: 'access',
  },
  {
    name: 'CodeX',
    description: 'Constructor y configurador de cursos Moodle',
    icon: '🏗️',
    color: '#f97316',
    href: 'https://moodlebuilder.pascualbravovirtual.edu.co/index.html',
    moduleCode: 'codex',
    submoduleCode: 'access',
  },
  {
    name: 'Encuestas',
    description: 'Creación y gestión de encuestas institucionales',
    icon: '📋',
    color: '#ec4899',
    href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login',
    moduleCode: 'surveys',
    submoduleCode: 'access',
  },
  {
    name: 'Informes (Onix-IA)',
    description: 'Generación de informes con inteligencia artificial',
    icon: '🤖',
    color: '#6366f1',
    comingSoon: true,
    moduleCode: 'onix_reports',
    submoduleCode: 'access',
  },
  {
    name: 'Rags',
    description: 'Herramienta de recursos y gestión académica',
    icon: '📚',
    color: '#14b8a6',
    comingSoon: true,
    moduleCode: 'rags',
    submoduleCode: 'access',
  },
  {
    name: 'Laboratorios Virtuales',
    description: 'Registro y consulta de calificaciones de laboratorios virtuales',
    icon: '🧪',
    color: '#22c55e',
    comingSoon: true,
    moduleCode: 'virtual_labs',
    submoduleCode: 'virtual_labs_grades',
  },
  {
    name: 'PM2',
    description: 'Panel de monitoreo de zonas y servicios',
    icon: '🗺️',
    color: '#a855f7',
    comingSoon: true,
    moduleCode: 'monitoring',
    submoduleCode: 'access',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { permissions } = usePermissions()

  const hasAccess = (service) => {
    if (!service.moduleCode) return true
    const mod = permissions?.modules?.find(m => m.module_code === service.moduleCode)
    if (!mod) return false
    if (service.submoduleCode) return mod.submodules.some(s => s.submodule_code === service.submoduleCode)
    return mod.submodules.length > 0
  }

  const visibleServices = services.filter(hasAccess)
>>>>>>> c5c2133de63dd7020c854abdacb0f8a9ae6800b5

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
<<<<<<< HEAD
    <div className="hub-card hub-kpi-card">
      <div className="hub-kpi-info">
        <strong className="hub-kpi-value">{value}</strong>
        <span className="hub-kpi-delta">
          <b>▲ {delta}</b> vs mes anterior
        </span>
=======
    <div className="bravosuite-home">
      <div className="bravosuite-header">
        <h1>Bravo Hub</h1>
        <p>Plataforma integrada de herramientas institucionales</p>
      </div>

      <div className="bravosuite-grid">
        {visibleServices.map((service, i) => (
          <div
            key={i}
            className={`bravosuite-card ${service.comingSoon ? 'bravosuite-card-soon' : ''}`}
            onClick={() => handleClick(service)}
            style={{'--card-color': service.color}}
          >
            <div className="bravosuite-card-top">
              <span className="bravosuite-card-icon">{service.icon}</span>
              {!service.comingSoon && !service.internal && (
                <span className="bravosuite-ext-badge">↗</span>
              )}
              {service.comingSoon && (
                <span className="bravosuite-soon-badge">Próximamente</span>
              )}
            </div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </div>
        ))}
>>>>>>> c5c2133de63dd7020c854abdacb0f8a9ae6800b5
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
