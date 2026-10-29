import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react'
import { useAuth } from "react-oidc-context";
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { usePermissions } from '../../services/PermissionsContext'
import { ChevronDown, Menu, ChevronsLeft, User, LogOut, X, ExternalLink, Sun, Moon, Search, Bell, CheckCheck, ClipboardList, UserMinus, CalendarClock, CircleCheck, CircleX, MessageSquare, AtSign, ListChecks, Cake, TriangleAlert, Clock, ChartColumn, Hourglass } from 'lucide-react'
import { menuItems } from './SideNavItems';
import { filterMenuByPermissions, SidebarItem } from './FilterMenu';
import MegaMenuPanel from './MegaMenuPanel'
import SectionNav from './SectionNav'
import { fetchSettings } from '../../services/settings/fetchSettings'
import { applyAppearance } from '../../services/settings/applyAppearance'
import { fetchActiveMenuLinks } from '../../services/settings/fetchActiveMenuLinks'
import { useNotificationsPolling } from '../../services/notifications/useNotificationsPolling'
import { buildNavSearchIndex, searchNavIndex } from './navSearchIndex'
import { applyChartTheme } from '../charts/chartTheme'
import config from "../../config.js";
import logoPositivo from '../../assets/Recursos/Iconos/Para fondo claros/SVG/bravo_hub_positivo.svg'
import logoNegativo from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/bravo_hub_negativo.svg'
import logoPascualPositivo from '../../assets/Recursos/Iconos/Para fondo claros/SVG/logo_pascual_positivo.svg'
import logoPascualNegativo from '../../assets/Recursos/Iconos/Para fondo oscuros/SVG/logo_pascual_negativo.svg'

// Debe coincidir con el breakpoint móvil del sidebar en Layout.css
const MOBILE_QUERY = '(max-width: 768px)'

// Los títulos de notificación vienen con un emoji al inicio (ver journey-api/api/notifications y api/atom):
// se quita y se muestra un ícono de un solo color en su lugar
const NOTIF_ICONS = {
  '📋': ClipboardList, '🚫': UserMinus, '🗓': CalendarClock, '✅': CircleCheck, '❌': CircleX,
  '💬': MessageSquare, '📣': AtSign, '☑': ListChecks, '🎉': Cake, '⚠': TriangleAlert,
  '⏰': Clock, '📊': ChartColumn, '💤': Hourglass,
}
const parseNotifTitle = (title = '') => {
  const m = title.match(/^(\p{Extended_Pictographic})️?\s*/u)
  if (!m) return { Icon: Bell, text: title }
  return { Icon: NOTIF_ICONS[m[1]] || Bell, text: title.slice(m[0].length) }
}


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

  // Apariencia (colores/tipografía) y accesos externos editables desde
  // Configuración: best-effort, si falla se queda con los defaults/estáticos.
  const [brandLogo, setBrandLogo] = useState('Bravo Hub')
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [extraLinks, setExtraLinks] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('bravohub_theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bravohub_theme', theme)
    applyChartTheme(theme === 'dark')
  }, [theme])
  useEffect(() => {
    fetchSettings('apariencia')
      .then(settings => {
        const porClave = applyAppearance(settings)
        if (porClave.logo_texto) setBrandLogo(porClave.logo_texto)
        if (porClave.logo_url) setLogoUrl(porClave.logo_url)
      })
      .catch(() => {})
    fetchActiveMenuLinks().then(setExtraLinks).catch(() => {})
  }, [])

  // Los enlaces configurables van en la sección de enlaces externos; luego se quitan
  // los divisores sobrantes (secciones que quedaron vacías por permisos)
  const sidebarMenu = filteredMenu
    .flatMap(item => item.type === 'extraLinks'
      ? extraLinks.map(l => ({ label: l.nombre, icon: ExternalLink, href: l.url, nueva_pestana: l.nueva_pestana }))
      : [item])
    .filter((item, i, arr) => item.type !== 'divider'
      || (i > 0 && arr[i - 1].type !== 'divider' && arr.slice(i + 1).some(n => n.type !== 'divider')))

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
  const location = useLocation()

  // Panel de submenú (Nexo, Administrador): queda atado a la ruta donde se abrió,
  // así se cierra solo al navegar
  const [mega, setMega] = useState(null)
  const megaItem = mega?.path === location.pathname ? mega.item : null
  const setMegaItem = useCallback(item => setMega(item && { item, path: location.pathname }), [location.pathname])
  const closeMega = useCallback(() => setMega(null), [])
  // Dentro de una sección con subgrupos (Nexo, Administrador) se muestra su barra de navegación
  const contienePath = (item, path) => item.path === path || !!item.children?.some(c => contienePath(c, path))
  const seccionActual = sidebarMenu.find(i => i.children?.some(c => c.children) && contienePath(i, location.pathname))
  const closeMenusOnLink = (e) => {
    if (e.target.closest('a')) { setMobileMenuOpen(false); setMegaItem(null) }
  }
  useEffect(() => {
    setUserMenuOpen(false)
  }, [location.pathname])
  const userMenuRef = useRef(null)
  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  // Campanita de notificaciones (ver services/notifications)
  const { unreadCount, notifications, loadingList, refreshList, markRead, markAllRead } = useNotificationsPolling()
  const [notifOpen, setNotifOpen] = useState(false)
  useEffect(() => {
    setNotifOpen(false)
  }, [location.pathname])
  const notifRef = useRef(null)
  useEffect(() => {
    if (!notifOpen) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])
  const toggleNotif = () => {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) refreshList()
  }
  // No leídas primero (sort estable: dentro de cada grupo se mantiene el orden por fecha)
  const sortedNotifs = useMemo(() => [...notifications].sort((a, b) => !b.read_at - !a.read_at), [notifications])
  const handleNotifClick = (n) => {
    if (!n.read_at) markRead(n.id)
    setNotifOpen(false)
    if (n.link) navigate(n.link)
  }
  const userName = profile?.username || auth.user?.profile?.email || 'Usuario'
  const userPhoto = profile?.photo_url
  // Guarda la URL que falló (no un booleano) para que una foto nueva se vuelva a intentar
  const [failedPhoto, setFailedPhoto] = useState(null)
  const userRole = permissions?.role

  // Búsqueda del navbar: de navegación (páginas/módulos), no de datos -- "Buscar
  // en Nexo..." (HomeNexo) sigue siendo la de usuarios/cursos/matrículas. Indexa
  // el mismo árbol ya filtrado por permisos que arma el sidebar (sidebarMenu),
  // así nunca sugiere una página a la que el usuario no tiene acceso.
  const [searchQ, setSearchQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const navIndex = useMemo(() => buildNavSearchIndex(sidebarMenu), [sidebarMenu])
  const searchResults = useMemo(() => searchNavIndex(navIndex, searchQ), [navIndex, searchQ])
  useEffect(() => { setSearchOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!searchOpen) return
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchOpen])
  const goToSearchResult = (r) => {
    setSearchQ('')
    setSearchOpen(false)
    if (r.external) window.open(r.href, '_blank', 'noopener,noreferrer')
    else navigate(r.path)
  }
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchResults.length > 0) goToSearchResult(searchResults[0])
  }

  return (
    <div className="app">
      {/* Gradiente de todos los íconos lucide salvo los del menú (regla svg.lucide en
          styles/global/index.css); mismos colores que las alertas del Home. Usa
          userSpaceOnUse (viewBox 24 de lucide): con objectBoundingBox los trazos
          rectos (ancho o alto 0) se quedan sin pintar */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <linearGradient id="app-icon-grad" gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0" stopColor="#5b7cfa" />
          <stop offset="1" stopColor="#9b6cff" />
        </linearGradient>
        {/* Para íconos sobre fondo oscuro: blanco a amarillo de marca (--nexo-yellow) */}
        <linearGradient id="app-icon-grad-dark" gradientUnits="userSpaceOnUse" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f9ec8f" />
        </linearGradient>
      </svg>
      <nav className="navbar">
        <div className="navbar-left">
          {/* En escritorio este bloque tiene el ancho y color del sidebar, así logo y
              hamburguesa quedan "dentro" del menú. Con el sidebar abierto lleva el logo
              negativo; al encogerlo solo queda la hamburguesa y el logo del tema pasa al navbar */}
          <div className={`navbar-menu-block ${sidebarMini ? 'navbar-menu-block-mini' : ''}`}>
            {!sidebarMini && (
              <img
                className="navbar-brand-logo navbar-brand-logo-sidebar"
                src={(logoUrl && !logoFailed) ? `${config.api_domain.url_base}${logoUrl}` : logoNegativo}
                alt={brandLogo}
                onError={() => setLogoFailed(true)}
              />
            )}
            <button
              className="toggle-btn"
              onClick={toggleSidebar}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : sidebarMini ? 'Expandir menú' : 'Contraer menú'}
              title={sidebarMini ? 'Expandir menú' : 'Contraer menú'}
            >
              {/* Escritorio: hamburguesa con el menú encogido, « para contraerlo; móvil: hamburguesa/cerrar (CSS elige cuál se ve) */}
              <span className="toggle-icon-desktop">{sidebarMini ? <Menu size={20} /> : <ChevronsLeft size={20} />}</span>
              <span className="toggle-icon-mobile">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</span>
            </button>
          </div>
          <span className={`navbar-brand ${!sidebarMini ? 'navbar-brand-onsidebar' : ''}`}>
            <img
              className="navbar-brand-logo navbar-brand-logo-theme"
              // Logo de marca: viene empaquetado con el build (src/assets/Recursos),
              // no de /uploads (esa carpeta está en .gitignore y no viaja con el
              // deploy). Un admin puede seguir subiendo un logo propio desde
              // Configuración > Apariencia (logoUrl); si no hay uno o si falla al
              // cargar, se usa el oficial de Bravo Hub. El nav cambia de fondo claro
              // a oscuro con el tema, así que en dark se usa el "negativo" (texto
              // blanco) en vez del "positivo" (texto navy), que ahí sería ilegible.
              src={(logoUrl && !logoFailed) ? `${config.api_domain.url_base}${logoUrl}` : (theme === 'dark' ? logoNegativo : logoPositivo)}
              alt={brandLogo}
              onError={() => setLogoFailed(true)}
            />
          </span>
        </div>
        {/* Buscador + logo institucional, juntos en el centro del navbar */}
        <div className="navbar-center">
        <div className="navbar-search" ref={searchRef}>
          <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
            <Search size={16} className="navbar-search-icon" />
            <input
              className="navbar-search-input"
              placeholder="Buscar páginas, módulos..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true) }}
              onFocus={() => searchQ && setSearchOpen(true)}
            />
          </form>
          {searchOpen && searchQ.trim() && (
            <div className="nav-search-dropdown">
              {searchResults.length === 0 && <p className="nav-search-empty">Sin resultados</p>}
              {searchResults.map((r, i) => (
                <button key={i} type="button" className="nav-search-item" onClick={() => goToSearchResult(r)}>
                  <span className="nav-search-item-label">{r.label}</span>
                  {r.breadcrumb && <span className="nav-search-item-breadcrumb">{r.breadcrumb}</span>}
                  {r.external && <ExternalLink size={11} className="nav-search-item-ext" />}
                </button>
              ))}
            </div>
          )}
        </div>
          <img
            className="navbar-institucional"
            src={theme === 'dark' ? logoPascualNegativo : logoPascualPositivo}
            alt="Institución Universitaria Pascual Bravo"
          />
        </div>
        <div className="navbar-right">
          <div className="notif-menu" ref={notifRef}>
            <button
              className="toggle-btn navbar-bell"
              aria-label="Notificaciones"
              title="Notificaciones"
              onClick={toggleNotif}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="navbar-bell-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span className="notif-dropdown-title">
                    Notificaciones
                    {unreadCount > 0 && <span className="notif-count">{unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead} title="Marcar todas como leídas">
                      <CheckCheck size={14} /> Marcar como leídas
                    </button>
                  )}
                </div>
                <ul className="notif-list">
                  {/* Solo se muestra "Cargando" la primera vez; al reabrir se refresca sin vaciar la lista */}
                  {loadingList && notifications.length === 0 && <li className="notif-empty">Cargando...</li>}
                  {!loadingList && notifications.length === 0 && (
                    <li className="notif-empty"><Bell size={28} /><span>No tienes notificaciones</span></li>
                  )}
                  {sortedNotifs.map((n, i) => {
                    const { Icon, text } = parseNotifTitle(n.title)
                    const unread = !n.read_at
                    const prevUnread = i > 0 && !sortedNotifs[i - 1].read_at
                    return (
                    <Fragment key={n.id}>
                      {i === 0 && unread && <li className="notif-section">Nuevas</li>}
                      {!unread && (i === 0 || prevUnread) && <li className="notif-section">Anteriores</li>}
                      <li>
                        <button
                          className={`notif-item ${unread ? 'notif-item-unread' : 'notif-item-read'}`}
                          onClick={() => handleNotifClick(n)}
                        >
                          <span className="notif-item-icon"><Icon size={16} /></span>
                          <span className="notif-item-content">
                            <span className="notif-item-title">{text}</span>
                            {n.body && <span className="notif-item-body">{n.body}</span>}
                            <span className="notif-item-date">
                              {new Date(n.created_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </span>
                          {unread && <span className="notif-item-dot" aria-label="No leída" />}
                        </button>
                      </li>
                    </Fragment>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          <button
            className="toggle-btn"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="user-menu" ref={userMenuRef}>
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
              {sidebarMenu.map((item, i) => (
                <SidebarItem key={i} item={item} onOpenMega={setMegaItem} megaLabel={megaItem?.label} onExpandir={sidebarMini ? () => setSidebarMini(false) : undefined} />
              ))}
            </ul>
          </aside>
          {megaItem && <MegaMenuPanel key={megaItem.label} item={megaItem} onClose={closeMega} onLinkClick={closeMenusOnLink} />}
        </div>
        {/* Nexo y Administrador usan el estilo de Onix-IA (esquinas rectas, títulos azul oscuro): solo apariencia, ver .estilo-hub en Layout.css */}
        <main className={`main-content${['Nexo', 'Administrador'].includes(seccionActual?.label) ? ' estilo-hub' : ''}`}>
          {seccionActual && <SectionNav key={seccionActual.label} item={seccionActual} />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}


export default Layout