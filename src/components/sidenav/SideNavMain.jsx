import { useState } from 'react'
import { useAuth } from "react-oidc-context";
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../services/PermissionsContext'
import {
  Home, RefreshCw, BookOpen, FileText, ChevronDown, Menu, User, LogOut,
  ExternalLink, Activity, LayoutGrid, Upload, Shield, Globe, BarChart2, Settings
} from 'lucide-react'
import { menuItems } from './SideNavItems';
import { filterMenuByPermissions, SidebarItem } from './FilterMenu';
import config from "../../config.js";


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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const userName = profile?.username || auth.user?.profile?.email || 'Usuario'
  const userPhoto = profile?.photo_url
  const userRole = permissions?.role

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-left">
          <button className="toggle-btn" onClick={() => setSidebarMini(!sidebarMini)}>
            <Menu size={20} />
          </button>
          <span className="navbar-brand">
            Br<span style={{ color: '#7dd3fc' }}>@</span>vo Suite
          </span>
        </div>
        <div className="user-menu">
          <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            {userPhoto
              ? <img className="user-btn-avatar" src={`${config.api_domain.url_base}${userPhoto}`} alt={userName} />
              : <User size={16} />}
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
        <aside className={`sidebar ${sidebarMini ? 'sidebar-mini' : ''}`}>
          <ul>
            {filteredMenu.map((item, i) => (
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


export default Layout