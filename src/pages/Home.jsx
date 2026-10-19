import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { Bell } from 'lucide-react'
import '../styles/global/Global.css'
import '../styles/global/Home.css'
import { fetchSettings } from '../services/settings/fetchSettings'
import { usePermissions } from '../services/PermissionsContext'
import { menuItems } from '../components/sidenav/SideNavItems'
import fondoBanner from '../assets/Recursos/Banner/fondo-banner.png'
import portatil from '../assets/Recursos/Banner/portatil.png'
// Tarjetas de "Herramientas frecuentes": fondo blanco, así que usan el set
// "Para fondo claros" (mismo criterio que el logo positivo del nav).
import iconNexoClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/nexo.svg'
import iconCodexClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/codex_1.svg'
import iconVisorClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/visor_1.svg'
import iconHubClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/hub_1.svg'
import iconBebrasClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/bebras_1.svg'

import {
  Sparkline,
  MiniBars,
  LineChart,
  DonutChart,
  StackedBarChart,
} from '../components/charts'

/* ---------- Herramientas frecuentes ----------
   Mismo destino (path/href) que ya tiene cada módulo en el sidebar
   (SideNavItems.jsx) — no se duplica la URL a mano. */
const findMenuItem = (label) => menuItems.find(m => m.label === label)

const tools = [
  { name: 'Nexo',   icon: iconNexoClaro,   path: findMenuItem('Nexo')?.path },
  { name: 'Codex',  icon: iconCodexClaro,  path: findMenuItem('CodeX')?.path },
  { name: 'Visor',  icon: iconVisorClaro,  href: findMenuItem('Visor')?.href },
  { name: 'Hub',    icon: iconHubClaro,    href: findMenuItem('Hub')?.href },
  { name: 'Bebras', icon: iconBebrasClaro, href: findMenuItem('Bebras')?.href },
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
const FRASE_DEFAULT = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod'

function saludoPorHora() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Home() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { profile } = usePermissions()
  const userName = profile?.username || auth.user?.profile?.email || 'Usuario'
  const [frase, setFrase] = useState(FRASE_DEFAULT)
  useEffect(() => {
    fetchSettings('home')
      .then(settings => {
        const frase_bienvenida = settings.find(s => s.clave === 'frase_bienvenida')?.valor
        if (frase_bienvenida) setFrase(frase_bienvenida)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="hub-home">
      <section className="hub-welcome" style={{ backgroundImage: `url(${fondoBanner})` }}>
        <div className="hub-welcome-text">
          <h1>{saludoPorHora()}, {userName}</h1>
          <p>{frase}</p>
        </div>
        <img className="hub-welcome-illustration" src={portatil} alt="" />
      </section>

      <aside className="hub-alerts">
        <h2 className="hub-title">Alertas y notificaciones</h2>
        <ul className="hub-alert-list">
          {alerts.map((a, i) => (
            <li key={i} className="hub-alert-item">
              <span className="hub-alert-icon"><Bell size={14} /></span>
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
          {tools.map((t, i) => {
            const content = (
              <>
                <span className="hub-tool-icon"><img src={t.icon} alt="" /></span>
                {t.name}
              </>
            )
            return t.href ? (
              <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="hub-card hub-tool-card">
                {content}
              </a>
            ) : (
              <button key={i} type="button" className="hub-card hub-tool-card" onClick={() => navigate(t.path)}>
                {content}
              </button>
            )
          })}
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
