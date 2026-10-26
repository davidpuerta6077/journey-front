import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { X, ArrowRight, LayoutGrid } from 'lucide-react'

// Un ítem del sidebar abre este panel (en vez del acordeón) cuando tiene subgrupos
// adentro (p.ej. Nexo > Sincronización > Cursos): se muestra cada subgrupo como
// una columna con su título, y los hijos sueltos van juntos en "General".

const SectionIcon = ({ icon: Icon }) => {
  if (!Icon) return null
  return (
    <span className="mega-section-icon" aria-hidden="true">
      {typeof Icon === 'string' ? <img src={Icon} alt="" /> : <Icon size={16} />}
    </span>
  )
}

const PanelLink = ({ item }) => {
  if (item.comingSoon) return <span className="mega-link mega-link-disabled">{item.label} <small>Próx.</small></span>
  if (item.href) return <a className="mega-link" href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
  return <NavLink to={item.path} end className={({ isActive }) => `mega-link${isActive ? ' active' : ''}`}>{item.label}</NavLink>
}

const MegaMenuPanel = ({ item, onClose, onLinkClick }) => {
  const panelRef = useRef(null)
  // El navbar no queda fijo al hacer scroll: el panel arranca donde termina lo visible de él
  const [top] = useState(() => Math.max(0, document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? 64))

  useEffect(() => {
    // Al abrir, el foco pasa al panel; al cerrar vuelve al botón que lo abrió
    const opener = document.activeElement
    panelRef.current?.querySelector('a, button')?.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    // Mientras está abierto la página de atrás no se desplaza (si no, el contenido
    // se mueve detrás del panel y el navbar se va con el scroll)
    const html = document.documentElement
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    // Se compensa el ancho de la barra de scroll para que la página no salte de lado
    html.style.paddingRight = `${window.innerWidth - html.clientWidth}px`
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      document.removeEventListener('keydown', handleKey)
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [onClose])

  const sueltos = item.children.filter(c => !c.children)
  const grupos = item.children.filter(c => c.children)
  // Los sueltos van primero si son el grueso del menú (Administrador) y al final si
  // son uno o dos accesos aparte (Nexo > Búsqueda)
  const general = sueltos.length > 0 ? [{ label: 'General', icon: LayoutGrid, children: sueltos }] : []
  const secciones = sueltos.length > grupos.length ? [...general, ...grupos] : [...grupos, ...general]

  return (
    <>
      <div className="mega-backdrop" style={{ top }} onClick={onClose} />
      <div ref={panelRef} className="mega-panel" style={{ top }} role="dialog" aria-labelledby="mega-title" onClick={onLinkClick}>
        <div className="mega-header">
          <div className="mega-header-text">
            <h3 id="mega-title" className="mega-title">{item.label}</h3>
            {item.path && (
              <NavLink to={item.path} end className="mega-home-link">
                Ir al inicio de {item.label} <ArrowRight size={14} aria-hidden="true" />
              </NavLink>
            )}
          </div>
          <button className="mega-close" onClick={onClose} aria-label="Cerrar submenú">
            <X size={20} />
          </button>
        </div>
        <div className="mega-grid" style={{ '--mega-cols': Math.min(secciones.length, 3), '--mega-cols-md': Math.min(secciones.length, 2) }}>
          {secciones.map(sec => (
            <section key={sec.label} className="mega-section" aria-labelledby={`mega-sec-${sec.label}`}>
              <h4 id={`mega-sec-${sec.label}`} className="mega-section-title">
                <SectionIcon icon={sec.icon} />
                {sec.label}
              </h4>
              <ul>
                {sec.children.map(child => (
                  <li key={child.label}><PanelLink item={child} /></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

export default MegaMenuPanel
