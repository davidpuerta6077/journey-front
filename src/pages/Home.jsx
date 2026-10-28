import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import '../styles/global/Global.css'
import '../styles/global/Home.css'
import { fetchSettings } from '../services/settings/fetchSettings'
import { usePermissions } from '../services/PermissionsContext'
import { menuItems } from '../components/sidenav/SideNavItems'
import { filterMenuByPermissions } from '../components/sidenav/FilterMenu'
// Tarjetas de "Herramientas frecuentes": fondo blanco, así que usan el set
// "Para fondo claros" (mismo criterio que el logo positivo del nav).
import iconNexoClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/nexo.svg'
// C0deX es un constructor de páginas: ícono de plantilla de página en vez del birrete del set
import iconCodexClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/codex_constructor.svg'
import iconVisorClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/visor_1.svg'
import iconHubClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/hub_1.svg'
import iconBebrasClaro from '../assets/Recursos/Iconos/Para fondo claros/SVG/bebras_1.svg'
import AtomWidget from '../components/atom/AtomWidget'
import HomeAlertas from './HomeAlertas'

/* ---------- Herramientas frecuentes ----------
   Mismo destino (path/href) que ya tiene cada módulo en el sidebar
   (SideNavItems.jsx) — no se duplica la URL a mano. */
const findMenuItem = (label) => menuItems.find(m => m.label === label)

const tools = [
  { name: 'Nexo',   icon: iconNexoClaro,   path: findMenuItem('Nexo')?.path },
  { name: 'C0deX',  icon: iconCodexClaro,  path: findMenuItem('C0deX')?.path },
  { name: 'Visor',  icon: iconVisorClaro,  href: findMenuItem('Visor')?.href },
  { name: 'Proyectos', icon: iconHubClaro, href: findMenuItem('Proyectos')?.href },
  { name: 'Campus Bebras', icon: iconBebrasClaro, href: findMenuItem('Campus Bebras')?.href },
]

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

  const [texto, autor] = frase.split(/\s*By:\s*/i)

  return (
    <div className="hub-home">
      <section className="hub-welcome">
        <div className="hub-welcome-text">
          <h1>{saludoPorHora()}, {userName}</h1>
          <blockquote className="hub-welcome-quote">
            <p>{texto.trim()}</p>
            {autor && <span>— {autor.trim()}</span>}
          </blockquote>
        </div>
      </section>

      <HomeAlertas conOnix={etiquetasPermitidas.has('Onix-IA')} conNexo={etiquetasPermitidas.has('Nexo')} />

      <section className="hub-tools">
        <h2 className="hub-title">Herramientas frecuentes</h2>
        <div className="hub-tools-row">
          {toolsVisibles.map((t, i) => {
            const content = (
              <>
                <span className="hub-tool-icon" style={{ '--icon': `url("${t.icon}")` }} />
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
