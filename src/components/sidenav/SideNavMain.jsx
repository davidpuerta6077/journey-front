import { useState } from 'react'
import { useAuth } from "react-oidc-context";
import { Outlet, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../services/PermissionsContext'
import { ChevronDown, Menu, User, LogOut, X } from 'lucide-react'
import { menuItems } from './SideNavItems';
import { filterMenuByPermissions, SidebarItem } from './FilterMenu';
import config from "../../config.js";

// Debe coincidir con el breakpoint móvil del sidebar en Layout.css
const MOBILE_QUERY = '(max-width: 768px)'


const Layout = () => {
  const auth = useAuth();

  //Logout process
  const signOutRedirect = () => {
    const clientId = "5hpvb84h2hm3rfsf6mbfs936hc";
    const logoutUri = `${config.aws.redirect_uri}/login`;
    const cognitoDomain = "https://us-east-1ynphsrvag.auth.us-east-1.amazoncognito.com";
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };
  //End logout process

  //Permission checking
  const { permissions, profile } = usePermissions()

  const allowedModuleCodes = permissions?.modules?.map(m => m.module_code) || []
  const allowedPairs = new Set(
    (permissions?.modules || []).flatMap(m =>
      m.submodules.map(s => `${m.module_code}::${s.submodule_code}`)
    )
  )

  const filteredMenu = filterMenuByPermissions(menuItems, allowedModuleCodes, allowedPairs)

  const [sidebarMini, setSidebarMini] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // En móvil la hamburguesa abre el menú a pantalla completa; en escritorio alterna el modo mini
  const toggleSidebar = () => {
    if (window.matchMedia(MOBILE_QUERY).matches) setMobileMenuOpen(o => !o)
    else setSidebarMini(m => !m)
  }

  // Al elegir una página (o un enlace externo) el menú móvil se cierra solo
  const closeMobileMenuOnLink = (e) => {
    if (e.target.closest('a')) setMobileMenuOpen(false)
  }
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const userName = profile?.username || auth.user?.profile?.email || 'Usuario'
  const userPhoto = profile?.photo_url
  // Guarda la URL que falló (no un booleano) para que una foto nueva se vuelva a intentar
  const [failedPhoto, setFailedPhoto] = useState(null)
  const userRole = permissions?.role

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="navbar-brand">
            Bravo Hub
          </span>
        </div>
        <div className="user-menu">
          <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            {userPhoto && failedPhoto !== userPhoto
              ? (
                <img
                  className="user-btn-avatar"
                  src={`${config.api_domain.url_base}${userPhoto}`}
                  alt={userName}
                  onError={() => setFailedPhoto(userPhoto)}
                />
              )
              : <span className="user-btn-avatar user-btn-avatar-placeholder"><User size={14} /></span>}
            <span className="user-btn-info">
              <span className="user-btn-name">{userName}</span>
              {userRole && <span className="user-btn-role">{userRole}</span>}
            </span>
            <ChevronDown size={14} />
          </button>
          {userMenuOpen && (
            <ul className="user-dropdown">
              <li>
                <button className="user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/perfil') }}>
                  Mi Perfil
                </button>
              </li>
              <li>
                <button className="logout-btn user-dropdown-item" onClick={signOutRedirect}>
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      <div className="app-body">
        {/* sidebar-slot reserva el ancho en la página; el aside se expande por encima
            del contenido al pasar el mouse en modo mini, sin empujar la página */}
        <div className={`sidebar-slot ${sidebarMini ? 'sidebar-slot-mini' : ''}`}>
          <aside
            className={`sidebar ${sidebarMini ? 'sidebar-mini' : ''} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}
            onClick={closeMobileMenuOnLink}
          >
            <ul>
              {filteredMenu.map((item, i) => (
                <SidebarItem key={i} item={item} />
              ))}
            </ul>
          </aside>
        </div>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


export default Layout