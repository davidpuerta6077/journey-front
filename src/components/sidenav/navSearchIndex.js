// Índice de navegación para la barra de búsqueda del navbar: aplana el árbol
// de menuItems YA FILTRADO por permisos (ver filterMenuByPermissions) en una
// lista plana de páginas, cada una con su "breadcrumb" (Nexo › Carga Masiva)
// para poder distinguir varias hojas con el mismo label (p.ej. "Usuarios"
// aparece bajo Sincronización, Módulos, Carga Masiva y Administrador).
function flatten(items, trail) {
  const out = []
  for (const item of items) {
    if (item.type === 'divider' || item.comingSoon || !item.label) continue
    const breadcrumb = trail.join(' › ')

    if (item.path) {
      out.push({ label: item.label, breadcrumb, path: item.path, icon: item.icon })
    } else if (item.href) {
      out.push({ label: item.label, breadcrumb, href: item.href, icon: item.icon, external: true })
    }

    if (item.children) {
      out.push(...flatten(item.children, [...trail, item.label]))
    }
  }
  return out
}

export function buildNavSearchIndex(filteredMenuTree) {
  return flatten(filteredMenuTree, [])
}

function normalize(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function searchNavIndex(index, term, limit = 8) {
  const t = normalize(term).trim()
  if (!t) return []
  return index
    .filter(entry => normalize(`${entry.breadcrumb} ${entry.label}`).includes(t))
    .slice(0, limit)
}
