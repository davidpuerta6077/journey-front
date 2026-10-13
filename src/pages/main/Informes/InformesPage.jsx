import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../../../services/PermissionsContext'
import { getPerfil } from '../../../services/onix/getPerfil'
import { alertError } from '../../../services/alerts'
import PerfilTab from './PerfilTab'
import ActividadesTab from './ActividadesTab'
import InformeTab from './InformeTab'
import AreaTab from './AreaTab'
import AdminTab from './AdminTab'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Informes/Informes.css'

export default function InformesPage() {
  const { permissions } = usePermissions()
  const tiene = (code) => permissions?.modules?.some((m) => m.submodules.some((s) => s.submodule_code === code))
  const puedeArea = tiene('onix_reports_area')
  const puedeAdmin = tiene('onix_reports_admin')

  const [perfil, setPerfil] = useState(undefined) // undefined = cargando, null = sin perfil
  const [tab, setTab] = useState('actividades')

  useEffect(() => {
    getPerfil()
      .then((p) => {
        setPerfil(p)
        if (!p) setTab('perfil')
      })
      .catch((e) => {
        setPerfil(null)
        alertError(e.message)
      })
  }, [])

  const tabs = useMemo(() => [
    { id: 'perfil', label: 'Mi perfil' },
    { id: 'actividades', label: 'Mis actividades' },
    { id: 'informe', label: 'Informe del mes' },
    ...(puedeArea || puedeAdmin ? [{ id: 'area', label: puedeAdmin ? 'Todos los informes' : 'Mi área' }] : []),
    ...(puedeAdmin ? [{ id: 'admin', label: 'Áreas' }] : []),
  ], [puedeArea, puedeAdmin])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <div>
          <h2>Informes (Onix-IA)</h2>
          <p className="onix-sub">Registra tu trabajo del mes y genera tu informe de actividades con IA.</p>
        </div>
      </div>

      <div className="onix-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={tab === t.id ? 'onix-tab active' : 'onix-tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {perfil === undefined ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : (
        <>
          {tab === 'perfil' && <PerfilTab perfil={perfil} onSaved={(p) => { setPerfil(p); setTab('actividades') }} />}
          {tab === 'actividades' && <ActividadesTab />}
          {tab === 'informe' && <InformeTab perfilCompleto={!!perfil} onIrAPerfil={() => setTab('perfil')} />}
          {tab === 'area' && <AreaTab esAdmin={puedeAdmin} />}
          {tab === 'admin' && <AdminTab />}
        </>
      )}
    </div>
  )
}
