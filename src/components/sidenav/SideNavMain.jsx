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


const Layout = () => {
  const auth = useAuth();

  //Logout process
  const signOutRedirect = () => {
    const clientId = "5hpvb84h2hm3rfsf6mbfs936hc";
    const logoutUri = "https://obscure-potato-wxvr56gq9pg257wq-5173.app.github.dev/login";
    const cognitoDomain = "https://us-east-1ynphsrvag.auth.us-east-1.amazoncognito.com";
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };
  //End logout process

  //Permission checking
  const { permissions } = usePermissions()

  const allowedModuleCodes = permissions?.modules?.map(m => m.module_code) || []
  const allowedSubmoduleCodes = permissions?.modules?.flatMap(m =>
    m.submodules.map(s => s.submodule_code)
  ) || []

  const filteredMenu = filterMenuByPermissions(menuItems, allowedModuleCodes, allowedSubmoduleCodes)

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
            Br<span style={{ color: '#7dd3fc' }}>@</span>vo Suite
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
                <button className="logout-btn" onClick={signOutRedirect}>
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