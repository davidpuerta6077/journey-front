import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react'


// allowedPairs: Set de claves "module_code::submodule_code" realmente concedidas al rol.
// No se usa una lista plana de submodule_code porque distintos módulos pueden reutilizar
// el mismo código de submódulo (p. ej. varios módulos usan "access"); comparar solo el
// código de submódulo permitiría que un permiso de un módulo "desbloqueara" otro módulo
// distinto que casualmente use el mismo código.
export const filterMenuByPermissions = (items, allowedModuleCodes, allowedPairs, inheritedModuleCode = null) => {
  return items.reduce((acc, item) => {
    if (item.type === 'divider') {
      acc.push(item)
      return acc
    }

    const moduleCode = item.moduleCode || inheritedModuleCode

    // Módulo con moduleCode: se valida primero el acceso al módulo
    if (item.moduleCode && !allowedModuleCodes.includes(item.moduleCode)) {
      return acc // sin permiso al módulo, no se muestra ni sus hijos
    }

    // Ítem (hoja o grupo) con submoduleCode propio: se valida el permiso puntual
    // como par (módulo, submódulo). Cubre enlaces externos, "comingSoon" y grupos
    // sin hijos reales, que antes se mostraban con solo pasar el filtro de moduleCode.
    if (item.submoduleCode && !allowedPairs.has(`${moduleCode}::${item.submoduleCode}`)) {
      return acc
    }

    if (item.children) {
      const filteredChildren = filterMenuByPermissions(item.children, allowedModuleCodes, allowedPairs, moduleCode)
      // Si tiene children reales (no comingSoon puro), filtrar; si son todos comingSoon se mantienen
      const hasRealChildren = item.children.some(c => !c.comingSoon)
      if (!hasRealChildren || filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children })
      }
      return acc
    }

    if (item.href || item.comingSoon) {
      acc.push(item) // ya pasó el filtro de moduleCode/submoduleCode arriba
      return acc
    }

    if (item.path) {
      if (item.path === '/' || !item.submoduleCode || allowedPairs.has(`${moduleCode}::${item.submoduleCode}`)) {
        acc.push(item)
      }
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

export const SidebarItem = ({ item, depth }) => {

  // El submenú solo abre/cierra con clic (antes también abría con hover,
  // pero el salto de layout al pasar el mouse se veía mal).
  const [open, setOpen] = useState(false)
  const Icon = item.icon || BookOpen

  const handleToggleClick = () => setOpen(o => !o)

  if (item.type === 'divider') {
    return <li><div className="sidebar-section-divider" /></li>
  }

  if (item.href) {
    const nuevaPestana = item.nueva_pestana !== false
    return (
      <li>
        <a href={item.href} target={nuevaPestana ? '_blank' : '_self'} rel={nuevaPestana ? 'noopener noreferrer' : undefined} className="sidebar-external">
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
    // Grupo con "home" propio (p.ej. Nexo): el texto/ícono navega directo a
    // item.path y la flecha, aparte, solo abre/cierra el submenú (que ya no
    // repite esa opción como hijo, ver SideNavItems.jsx).
    if (item.path) {
      return (
        <li>
          <div className={`sidebar-toggle sidebar-group-row ${item.nexoApp ? 'nexo-toggle' : ''}`}>
            <NavLink to={item.path} end className={({ isActive }) => `sidebar-group-link${isActive ? ' active' : ''}`}>
              <Icon size={16} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
            <button
              className="sidebar-chevron-btn"
              onClick={handleToggleClick}
              aria-expanded={open}
              aria-label={`Mostrar submenú de ${item.label}`}
            >
              <ChevronDown size={14} className={open ? 'chevron open' : 'chevron'} />
            </button>
          </div>
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
        <button
          className={`sidebar-toggle ${item.nexoApp ? 'nexo-toggle' : ''}`}
          onClick={handleToggleClick}
          aria-expanded={open}
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

