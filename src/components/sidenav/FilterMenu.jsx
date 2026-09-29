import { useEffect, useRef, useState } from 'react'
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

// Hover solo en escritorio con mouse; en móvil/táctil los grupos se abren con toque
const HOVER_QUERY = '(hover: hover) and (min-width: 769px)'
const HOVER_OPEN_DELAY = 150  // evita abrir todos los grupos al pasar el mouse de corrido
const HOVER_CLOSE_DELAY = 250 // da margen al mover el mouse entre el grupo y sus hijos

export const SidebarItem = ({ item, depth }) => {

  // pinned: abierto con clic (queda fijo). hovered: abierto temporalmente por hover.
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoverTimer = useRef(null)
  const open = pinned || hovered
  const Icon = item.icon || BookOpen

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const handleMouseEnter = () => {
    if (!window.matchMedia(HOVER_QUERY).matches) return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHovered(true), HOVER_OPEN_DELAY)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHovered(false), HOVER_CLOSE_DELAY)
  }

  // Si el grupo estaba abierto solo por hover, el clic lo fija abierto en vez de cerrarlo
  const handleToggleClick = () => {
    clearTimeout(hoverTimer.current)
    if (hovered && !pinned) setPinned(true)
    else {
      setPinned(!open)
      setHovered(false)
    }
  }

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
      <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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

