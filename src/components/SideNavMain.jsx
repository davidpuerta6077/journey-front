import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, RefreshCw, BookOpen, FileText, ChevronDown, Menu, User, LogOut, 
  ExternalLink, Activity, LayoutGrid, Upload, Shield, Globe, BarChart2, Settings
} from 'lucide-react'

const menuItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Journey Sync', icon: RefreshCw, journeyApp: true, children: [
      { label: 'Home', icon: Home, path: '/HomeJourney' },
      { label: 'Sincronización', icon: RefreshCw, children: [
          { label: 'Usuarios Plataforma', path: '/sync/usuarios' },
          { label: 'Matrículas', path: '/sync/matriculas' },
          { label: 'Cursos', path: '/sync/cursos' },
      ]},
      { label: 'Módulos', icon: BookOpen, children: [
          { label: 'Usuarios', path: '/modulos/usuarios' },
          { label: 'Cursos y categorías', path: '/modulos/cursos' },
          { label: 'Matrículas', path: '/modulos/matriculas' },
      ]},
      { label: 'Carga Masiva', icon: Upload, children: [
          { label: 'Usuarios', path: '/carga/usuarios' },
          { label: 'Matrículas', path: '/carga/matriculas' },
          { label: 'Novedades', path: '/carga/novedades' },
          { label: 'Desmatrículas', path: '/carga/desmatriculas' },
      ]},
      { label: 'Reglas', icon: Shield, children: [
          { label: 'Reglas activas', path: '/reglas/activas' },
          { label: 'Plantillas', path: '/reglas/plantillas' },
      ]},
      { label: 'Integración', icon: Globe, children: [
          { label: 'Estado de APIs', path: '/integracion/apis' },
      ]},
      { label: 'Reportes', icon: FileText, path: '/reportes' },
      { label: 'Estadísticas', icon: BarChart2, path: '/estadisticas' },
      { label: 'Configuración', icon: Settings, path: '/configuracion' },
  ]},
  { type: 'divider' },
  { label: 'Centro de soporte', icon: ExternalLink, href: 'https://soporte.pascualbravovirtual.edu.co/scp/login.php' },
  { label: 'Hub', icon: ExternalLink, href: 'https://hub.pascualbravovirtual.edu.co/login' },
  { label: 'SIDEM', icon: ExternalLink, href: 'https://seguimiento.pascualbravovirtual.edu.co/' },
  { label: 'Monitoreo', icon: Activity, children: [
      { label: 'Matomo', comingSoon: true },
      { label: 'Zabbix', comingSoon: true },
      { label: 'PMZ', comingSoon: true },
      { label: 'Bases de Datos', comingSoon: true },
  ]},
  { label: 'Bebras', icon: ExternalLink, href: 'https://bebras.pascualbravovirtual.edu.co/Siadi/public/' },
  { label: 'Rags', icon: LayoutGrid, comingSoon: true },
  { label: 'Informes (Onix-IA)', icon: FileText, comingSoon: true },
  { label: 'Moodle Builder', icon: ExternalLink, href: 'https://moodlebuilder.pascualbravovirtual.edu.co/index.html' },
  { label: 'Encuestas', icon: ExternalLink, href: 'https://encuestas.pascualbravovirtual.edu.co/index.php/admin/authentication/sa/login' },
]

function SidebarItem({ item, depth }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon || BookOpen

  if (item.type === 'divider') {
    return <li><div className="sidebar-section-divider" /></li>
  }

  if (item.href) {
    return (
      <li>
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="sidebar-external">
          <Icon size={16} className="sidebar-icon" />
          <span>{item.label}</span>
          <ExternalLink size={11} style={{marginLeft: 'auto', opacity: 0.4}} />
        </a>
      </li>
    )
  }

  if (item.comingSoon) {
    return (
      <li>
        <span className="sidebar-disabled">
          <Icon size={16} className="sidebar-icon" />
          <span>{item.label}</span>
          <span style={{marginLeft: 'auto', fontSize: '10px'}}>Próx.</span>
        </span>
      </li>
    )
  }

  if (item.children) {
    return (
      <li>
        <button
          className={`sidebar-toggle ${item.journeyApp ? 'journey-toggle' : ''}`}
          onClick={() => setOpen(!open)}
        >
          <Icon size={16} className="sidebar-icon" />
          <span>{item.label}</span>
          <ChevronDown size={14} className={open ? 'chevron open' : 'chevron'} />
        </button>
        {open && (
          <ul className="submenu">
            {item.children.map((child, i) => (
              <SidebarItem key={i} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
        <Icon size={16} className="sidebar-icon" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  )
}

SidebarItem.defaultProps = { depth: 0 }

export default function Layout() {
  const [sidebarMini, setSidebarMini] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          <button className="toggle-btn" onClick={() => setSidebarMini(!sidebarMini)}>
            <Menu size={20} />
          </button>
          <span className="navbar-brand">
            Br<span style={{color: '#7dd3fc'}}>@</span>vo Suite
          </span>
        </div>
        <div className="user-menu">
          <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <User size={16} />
            <span>{user.name || user.email || 'Usuario'}</span>
            <ChevronDown size={14} />
          </button>
          {userMenuOpen && (
            <ul className="user-dropdown">
              <li><a href="#">Mi Perfil</a></li>
              <li><a href="#">Ver Logs</a></li>
              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      <div className="app-body">
        <aside className={`sidebar ${sidebarMini ? 'sidebar-mini' : ''}`}>
          <ul>
            {menuItems.map((item, i) => (
              <SidebarItem key={i} item={item} />
            ))}
          </ul>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}