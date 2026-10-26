import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { Bell } from 'lucide-react'
import '../styles/global/Global.css'
import '../styles/global/Home.css'
import { fetchSettings } from '../services/settings/fetchSettings'
import { usePermissions } from '../services/PermissionsContext'
import { menuItems } from '../components/sidenav/SideNavItems'
import { filterMenuByPermissions } from '../components/sidenav/FilterMenu'
import fondoBanner from '../assets/Recursos/Banner/fondo-banner.png'
import portatil from '../assets/Recursos/Banner/portatil.png'
// Tarjetas de "Herramientas frecuentes": fondo blanco, así que usan el set
// "Para fondo claros" (mismo criterio que el logo positivo del nav).
import iconNexoClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/nexo.svg'
import iconCodexClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/codex_1.svg'
import iconVisorClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/visor_1.svg'
import iconHubClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/hub_1.svg'
import iconBebrasClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/bebras_1.svg'
import AtomWidget from '../components/atom/AtomWidget'

/* ---------- Herramientas frecuentes ----------
   Mismo destino (path/href) que ya tiene cada módulo en el sidebar
   (SideNavItems.jsx) — no se duplica la URL a mano. */
const findMenuItem = (label) => menuItems.find(m => m.label === label)

const tools = [
  { name: 'Nexo',   icon: iconNexoClaro,   path: findMenuItem('Nexo')?.path },
  { name: 'C0deX',  icon: iconCodexClaro,  path: findMenuItem('C0deX')?.path },
  { name: 'Visor',  icon: iconVisorClaro,  href: findMenuItem('Visor')?.href },
  { name: 'Proyecto', icon: iconHubClaro, href: findMenuItem('Proyecto')?.href },
  { name: 'Campus Bebras', icon: iconBebrasClaro, href: findMenuItem('Campus Bebras')?.href },
]

const alerts = Array.from({ length: 4 }, () => ({
  title: 'Lorem ipsum dolor sit amet',
  text: 'consectetur adipiscing elit',
}))

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
  const { profile, permissions } = usePermissions()
  const userName = profile?.username || auth.user?.profile?.email || 'Usuario'
  // Mismo filtro que arma el sidebar (SideNavMain.jsx): se reusa la función,
  // no la lógica, para no duplicar reglas (ej. Nexo no tiene submoduleCode
  // propio, solo moduleCode — filterMenuByPermissions ya sabe resolver eso).
  const allowedModuleCodes = permissions?.modules?.map(m => m.module_code) || []
  const allowedPairs = new Set(
    (permissions?.modules || []).flatMap(m => m.submodules.map(s => `${m.module_code}::${s.submodule_code}`))
  )
  const etiquetasPermitidas = new Set(filterMenuByPermissions(menuItems, allowedModuleCodes, allowedPairs).map(m => m.label))
  const toolsVisibles = tools.filter(t => etiquetasPermitidas.has(t.name))
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
          {toolsVisibles.map((t, i) => {
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

      <AtomWidget />
    </div>
  )
}
