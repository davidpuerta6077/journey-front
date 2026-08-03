import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { menuItems } from './SideNavItems';
import {
  Home, RefreshCw, BookOpen, FileText, ChevronDown, Menu, User, LogOut,
  ExternalLink, Activity, LayoutGrid, Upload, Shield, Globe, BarChart2, Settings
} from 'lucide-react'


export const filterMenuByPermissions = (items, allowedModuleCodes, allowedSubmoduleCodes) => {
  return items.reduce((acc, item) => {
    if (item.type === 'divider') {
      acc.push(item)
      return acc
    }

    // Módulo con moduleCode: se valida primero el acceso al módulo
    if (item.moduleCode && !allowedModuleCodes.includes(item.moduleCode)) {
      return acc // sin permiso al módulo, no se muestra ni sus hijos
    }

    if (item.children) {
      const filteredChildren = filterMenuByPermissions(item.children, allowedModuleCodes, allowedSubmoduleCodes)
      // Si tiene children reales (no comingSoon puro), filtrar; si son todos comingSoon se mantienen
      const hasRealChildren = item.children.some(c => !c.comingSoon)
      if (!hasRealChildren || filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children })
      }
      return acc
    }

    if (item.href || item.comingSoon) {
      acc.push(item) // ya pasó el filtro de moduleCode arriba (si tenía)
      return acc
    }

    if (item.path) {
      if (item.path === '/' || !item.submoduleCode || allowedSubmoduleCodes.includes(item.submoduleCode)) {
        acc.push(item)
      }
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

export const SidebarItem = ({ item, depth }) => {

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
          <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.4 }} />
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
          <span style={{ marginLeft: 'auto', fontSize: '10px' }}>Próx.</span>
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

