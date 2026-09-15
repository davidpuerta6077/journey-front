import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search, CheckSquare, XSquare, Square, MinusSquare,
  ChevronDown, ChevronRight
} from 'lucide-react'
import { fetchPermisos } from '../../../services/admin/fetchPermisos'
import { grantPermiso } from '../../../services/admin/grantPermiso'
import { revokePermiso } from '../../../services/admin/revokePermiso'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Admin/AdminPermisos.css"

// Descripciones cortas por módulo (mismo texto usado en el home de Bravo Hub).
const MODULE_DESCRIPTIONS = {
  nexo_sync:       'Sincronización de usuarios, cursos y matrículas con Moodle.',
  admin:           'Administración de usuarios de plataforma, roles y permisos de Bravo Hub.',
  support_center:  'Gestión de tickets y soporte técnico institucional.',
  hub:             'Portal centralizado de recursos y herramientas.',
  visor:           'Sistema de seguimiento y monitoreo académico.',
  monitoring:      'Monitoreo de infraestructura y servidores.',
  bebras:          'Plataforma de pensamiento computacional.',
  rags:            'Herramienta de recursos y gestión académica.',
  onix_reports:    'Generación de informes con inteligencia artificial.',
  codex:           'Constructor y configurador de cursos Moodle.',
  surveys:         'Creación y gestión de encuestas institucionales.',
}

// Nexo Sync tiene muchos submódulos: se agrupan por categoría para no
// mostrar una lista larga. El resto de módulos se muestra como lista simple.
const CATEGORY_ORDER = ['Usuarios', 'Cursos', 'Matrículas', 'Reglas', 'Integración', 'Reportes', 'Configuración']

function categorize(code) {
  if (code.includes('user')) return 'Usuarios'
  if (code.includes('course')) return 'Cursos'
  if (code.includes('enrollment')) return 'Matrículas'
  if (code.startsWith('rules')) return 'Reglas'
  if (code.startsWith('integration')) return 'Integración'
  if (code === 'reports' || code === 'statistics') return 'Reportes'
  return 'Configuración'
}

function TriStateCheckbox({ checked, indeterminate, onChange, disabled, title }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      title={title}
      onClick={e => e.stopPropagation()}
    />
  )
}

function countBadgeClass(granted, total) {
  if (total === 0) return 'permisos-module-count is-empty'
  if (granted === total) return 'permisos-module-count is-full'
  return 'permisos-module-count'
}

export default function AdminPermisos() {
  const [data, setData]       = useState({ roles: [], modules: [], grants: [] })
  const [loading, setLoading] = useState(true)
  const [roleId, setRoleId]   = useState('')
  const [draft, setDraft]     = useState(new Set())
  const [search, setSearch]   = useState('')
  const [expandedModules, setExpandedModules] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  const serverSetForRole = useCallback((rid, grants) =>
    new Set(grants.filter(g => String(g.role_id) === rid).map(g => g.submodule_id)),
  [])

  const loadData = useCallback(async (preserveRoleId) => {
    setLoading(true)
    setSaveError('')
    try {
      const result = await fetchPermisos()
      setData(result)
      const nextRoleId = preserveRoleId || String(result.roles[0]?.id || '')
      setRoleId(nextRoleId)
      setDraft(serverSetForRole(nextRoleId, result.grants))
    } catch (e) {
      console.error('Error cargando permisos:', e.message)
    }
    setLoading(false)
  }, [serverSetForRole])

  useEffect(() => { loadData() }, [loadData])

  const selectedRole = data.roles.find(r => String(r.id) === roleId)
  const isSystemRole = !!selectedRole?.is_system_default

  const currentServerSet = useMemo(
    () => serverSetForRole(roleId, data.grants),
    [serverSetForRole, roleId, data.grants]
  )

  const isDirty = useMemo(() => {
    if (draft.size !== currentServerSet.size) return true
    for (const id of draft) if (!currentServerSet.has(id)) return true
    return false
  }, [draft, currentServerSet])

  const handleRoleChange = (newRoleId) => {
    if (isDirty && !confirm('Tienes cambios sin guardar en este rol. ¿Descartarlos y cambiar de rol?')) return
    setRoleId(newRoleId)
    setDraft(serverSetForRole(newRoleId, data.grants))
    setSaveError('')
  }

  const toggleSubmodule = (submoduleId) => {
    setDraft(prev => {
      const next = new Set(prev)
      if (next.has(submoduleId)) next.delete(submoduleId)
      else next.add(submoduleId)
      return next
    })
  }

  const toggleModuleAll = (submoduleIds) => {
    const allSelected = submoduleIds.every(id => draft.has(id))
    setDraft(prev => {
      const next = new Set(prev)
      submoduleIds.forEach(id => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const toggleModuleExpanded = (moduleId) =>
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))

  const toggleCategoryExpanded = (key) =>
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }))

  // ─── Búsqueda ───────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase()
  const filteredModules = useMemo(() => {
    if (!q) return data.modules
    return data.modules
      .map(mod => {
        const moduleMatches = mod.module_name.toLowerCase().includes(q)
        const submodules = moduleMatches
          ? mod.submodules
          : mod.submodules.filter(s =>
              s.submodule_name.toLowerCase().includes(q) || s.submodule_code.toLowerCase().includes(q)
            )
        return { ...mod, submodules }
      })
      .filter(mod => mod.submodules.length > 0)
  }, [data.modules, q])

  const visibleSubmoduleIds = useMemo(
    () => filteredModules.flatMap(m => m.submodules.map(s => s.submodule_id)),
    [filteredModules]
  )

  const handleSelectAll = () => {
    setDraft(prev => new Set([...prev, ...visibleSubmoduleIds]))
  }
  const handleClearSelection = () => {
    setDraft(prev => {
      const next = new Set(prev)
      visibleSubmoduleIds.forEach(id => next.delete(id))
      return next
    })
  }

  const handleCancelar = () => {
    setDraft(serverSetForRole(roleId, data.grants))
    setSaveError('')
  }

  const handleGuardar = async () => {
    setSaving(true)
    setSaveError('')
    const roleIdNum = Number(roleId)
    const toAdd = [...draft].filter(id => !currentServerSet.has(id))
    const toRemove = [...currentServerSet].filter(id => !draft.has(id))
    try {
      await Promise.all([
        ...toAdd.map(id => grantPermiso(roleIdNum, id)),
        ...toRemove.map(id => revokePermiso(roleIdNum, id)),
      ])
      await loadData(roleId)
    } catch (e) {
      setSaveError(e.message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="sync-page">
        <div className="sync-page-header"><h2>Permisos</h2></div>
        <div className="loading-box"><span className="loader"></span>Cargando permisos...</div>
      </div>
    )
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Permisos</h2>
      </div>
      <p className="permisos-intro">
        Define a qué módulos y submódulos de Bravo Hub tiene acceso cada rol.
        Los cambios se aplican al hacer clic en "Guardar cambios".
      </p>

      <div className="permisos-role-bar">
        <select className="filter-select" value={roleId} onChange={e => handleRoleChange(e.target.value)}>
          {data.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <span className={`badge ${isSystemRole ? 'badge-db' : 'badge-pending'}`}>
          {isSystemRole ? 'Rol de sistema' : 'Rol personalizado'}
        </span>
        <div className="permisos-role-spacer" />
        <button className="btn-secondary" onClick={handleCancelar} disabled={!isDirty || saving}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleGuardar} disabled={!isDirty || saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {saveError && <div className="modal-error permisos-save-error">{saveError}</div>}

      <div className="permisos-toolbar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar módulo o permiso..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="permisos-toolbar-btn" onClick={handleSelectAll} disabled={visibleSubmoduleIds.length === 0}>
          <CheckSquare size={14} /> Seleccionar todo
        </button>
        <button className="permisos-toolbar-btn" onClick={handleClearSelection} disabled={visibleSubmoduleIds.length === 0}>
          <XSquare size={14} /> Limpiar selección
        </button>
      </div>

      <div className="permisos-legend">
        <span className="permisos-legend-item is-selected"><CheckSquare size={14} /> Seleccionado</span>
        <span className="permisos-legend-item is-partial"><MinusSquare size={14} /> Parcialmente seleccionado</span>
        <span className="permisos-legend-item is-empty"><Square size={14} /> Sin seleccionar</span>
      </div>

      <div className="permisos-grid">
        {filteredModules.length === 0 && (
          <div className="permisos-empty-state">No se encontraron módulos ni permisos para "{search}".</div>
        )}

        {filteredModules.map(mod => {
          const subIds = mod.submodules.map(s => s.submodule_id)
          const granted = subIds.filter(id => draft.has(id)).length
          const isOpen = q ? true : !!expandedModules[mod.module_id]
          const isNexoSync = mod.module_code === 'nexo_sync'

          const categorized = isNexoSync
            ? mod.submodules.reduce((acc, s) => {
                const cat = categorize(s.submodule_code)
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(s)
                return acc
              }, {})
            : null

          return (
            <div key={mod.module_id} className="permisos-module-card">
              <div className="permisos-module-header" onClick={() => toggleModuleExpanded(mod.module_id)}>
                <span className="permisos-module-check">
                  <TriStateCheckbox
                    checked={granted === subIds.length && subIds.length > 0}
                    indeterminate={granted > 0 && granted < subIds.length}
                    onChange={() => toggleModuleAll(subIds)}
                    title="Seleccionar/deseleccionar todo el módulo"
                  />
                </span>
                <div className="permisos-module-info">
                  <div className="permisos-module-title">{mod.module_name}</div>
                  <div className="permisos-module-desc">
                    {MODULE_DESCRIPTIONS[mod.module_code] || `Gestión de accesos de ${mod.module_name}.`}
                  </div>
                </div>
                <div className="permisos-module-meta">
                  <span className={countBadgeClass(granted, subIds.length)}>{granted} / {subIds.length} permisos</span>
                  {isOpen ? <ChevronDown size={16} className="permisos-module-chevron" /> : <ChevronRight size={16} className="permisos-module-chevron" />}
                </div>
              </div>

              {isOpen && (
                <div className="permisos-module-body">
                  {isNexoSync ? (
                    CATEGORY_ORDER.filter(cat => categorized[cat]?.length).map(cat => {
                      const items = categorized[cat]
                      const catIds = items.map(s => s.submodule_id)
                      const catGranted = catIds.filter(id => draft.has(id)).length
                      const catKey = `${mod.module_id}:${cat}`
                      const catOpen = q ? true : !!expandedCategories[catKey]
                      return (
                        <div key={cat} className="permisos-category">
                          <div className="permisos-category-header" onClick={() => toggleCategoryExpanded(catKey)}>
                            {catOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            <span>{cat}</span>
                            <span className={countBadgeClass(catGranted, catIds.length)}>{catGranted} / {catIds.length}</span>
                          </div>
                          {catOpen && (
                            <div className="permisos-category-body">
                              {items.map(s => (
                                <label key={s.submodule_id} className="permisos-checkbox-row">
                                  <input
                                    type="checkbox"
                                    checked={draft.has(s.submodule_id)}
                                    onChange={() => toggleSubmodule(s.submodule_id)}
                                  />
                                  <span>{s.submodule_name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    mod.submodules.map(s => (
                      <label key={s.submodule_id} className="permisos-checkbox-row">
                        <input
                          type="checkbox"
                          checked={draft.has(s.submodule_id)}
                          onChange={() => toggleSubmodule(s.submodule_id)}
                        />
                        <span>{s.submodule_name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
