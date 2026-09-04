import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPermisos } from '../../../services/admin/fetchPermisos'
import { grantPermiso } from '../../../services/admin/grantPermiso'
import { revokePermiso } from '../../../services/admin/revokePermiso'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Admin/AdminPermisos.css"

export default function AdminPermisos() {
  const [data, setData]           = useState({ roles: [], modules: [], grants: [] })
  const [loading, setLoading]     = useState(true)
  const [roleId, setRoleId]       = useState('')
  const [pending, setPending]     = useState({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchPermisos()
      setData(result)
      setRoleId(prev => prev || String(result.roles[0]?.id || ''))
    } catch (e) {
      console.error('Error cargando permisos:', e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const grantedSet = useMemo(
    () => new Set(data.grants.filter(g => String(g.role_id) === roleId).map(g => g.submodule_id)),
    [data.grants, roleId]
  )

  const handleToggle = async (submoduleId, checked) => {
    const key = `${roleId}-${submoduleId}`
    setPending(p => ({ ...p, [key]: true }))
    const roleIdNum = Number(roleId)
    try {
      if (checked) {
        await grantPermiso(roleIdNum, submoduleId)
        setData(d => ({ ...d, grants: [...d.grants, { role_id: roleIdNum, submodule_id: submoduleId }] }))
      } else {
        await revokePermiso(roleIdNum, submoduleId)
        setData(d => ({ ...d, grants: d.grants.filter(g => !(g.role_id === roleIdNum && g.submodule_id === submoduleId)) }))
      }
    } catch (e) {
      console.error('Error actualizando permiso:', e.message)
      alert(e.message)
    }
    setPending(p => { const next = { ...p }; delete next[key]; return next })
  }

  const selectedRole = data.roles.find(r => String(r.id) === roleId)

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Permisos</h2>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando permisos...</div>
      ) : (
        <>
          <div className="filters-bar">
            <select className="filter-select" value={roleId} onChange={e => setRoleId(e.target.value)}>
              {data.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {selectedRole?.is_system_default && (
              <span className="badge badge-db">Rol de sistema — normalmente con acceso total</span>
            )}
          </div>

          <div className="permisos-grid">
            {data.modules.map(mod => (
              <div key={mod.module_id} className="permisos-module-card">
                <div className="permisos-module-title">{mod.module_name}</div>
                <div className="permisos-submodule-list">
                  {mod.submodules.map(sub => {
                    const key = `${roleId}-${sub.submodule_id}`
                    const checked = grantedSet.has(sub.submodule_id)
                    return (
                      <label key={sub.submodule_id} className="permisos-checkbox-row">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!!pending[key]}
                          onChange={e => handleToggle(sub.submodule_id, e.target.checked)}
                        />
                        <span>{sub.submodule_name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
