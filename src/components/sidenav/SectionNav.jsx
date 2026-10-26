import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Home } from 'lucide-react'

// Barra de navegación interna de una sección (Nexo, Administrador): queda arriba del
// contenido en todas sus páginas, con "Inicio" y cada submenú como pestaña;
// los grupos (Sincronización, Módulos...) despliegan sus páginas y la elegida
// se carga debajo (es el <Outlet /> del Layout).

const contienePath = (item, path) => item.path === path || !!item.children?.some(c => contienePath(c, path))

const SectionNav = ({ item }) => {
  const location = useLocation()
  const [abierto, setAbierto] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const handleClickOutside = (e) => { if (!navRef.current?.contains(e.target)) setAbierto(null) }
    const handleKey = (e) => { if (e.key === 'Escape') setAbierto(null) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [abierto])

  // Los íconos SVG del sidebar son para fondo oscuro: si algún hijo usa uno, la
  // barra va sin íconos para que todas las pestañas se vean iguales
  const conIconos = item.children.every(c => typeof c.icon !== 'string')

  return (
    <nav ref={navRef} className="section-nav" aria-label={`Navegación de ${item.label}`}>
      {item.path && (
        <NavLink to={item.path} end className={({ isActive }) => `section-nav-tab${isActive ? ' active' : ''}`}>
          <Home size={15} aria-hidden="true" /> Inicio
        </NavLink>
      )}
      {item.children.map(child => {
        const Icon = conIconos ? child.icon : null
        if (!child.children) {
          return (
            <NavLink key={child.label} to={child.path} end className={({ isActive }) => `section-nav-tab${isActive ? ' active' : ''}`}>
              {Icon && <Icon size={15} aria-hidden="true" />} {child.label}
            </NavLink>
          )
        }
        const estaAbierto = abierto === child.label
        const activo = contienePath(child, location.pathname)
        return (
          <div key={child.label} className="section-nav-group">
            <button
              type="button"
              className={`section-nav-tab${activo ? ' active' : ''}${estaAbierto ? ' open' : ''}`}
              aria-expanded={estaAbierto}
              aria-haspopup="true"
              onClick={() => setAbierto(estaAbierto ? null : child.label)}
            >
              {Icon && <Icon size={15} aria-hidden="true" />} {child.label}
              <ChevronDown size={14} className={estaAbierto ? 'chevron open' : 'chevron'} aria-hidden="true" />
            </button>
            {estaAbierto && (
              <ul className="section-nav-dropdown">
                {child.children.map(leaf => (
                  <li key={leaf.label}>
                    <NavLink
                      to={leaf.path}
                      end
                      className={({ isActive }) => `section-nav-link${isActive ? ' active' : ''}`}
                      onClick={() => setAbierto(null)}
                    >
                      {leaf.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default SectionNav
