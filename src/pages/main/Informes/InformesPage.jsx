import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../../../services/PermissionsContext'
import { getPerfil } from '../../../services/onix/getPerfil'
import { alertError } from '../../../services/alerts'
import MiMesTab from './MiMesTab'
import ConfiguracionTab from './ConfiguracionTab'
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
  const [tab, setTab] = useState('mes')

  useEffect(() => {
    getPerfil()
      .then((p) => {
        setPerfil(p)
        if (!p) setTab('config')
      })
      .catch((e) => {
        setPerfil(null)
        alertError(e.message)
      })
  }, [])

  const tabs = useMemo(() => [
    { id: 'mes', label: 'Mi mes' },
    { id: 'config', label: 'Configuración' },
    ...(puedeArea || puedeAdmin ? [{ id: 'area', label: puedeAdmin ? 'Todos los informes' : 'Mi área' }] : []),
    ...(puedeAdmin ? [{ id: 'admin', label: 'Áreas' }] : []),
  ], [puedeArea, puedeAdmin])

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <div>
          <h2>Informes (Onix-IA)</h2>
          <p className="onix-sub">Registra cada mes las subactividades de tus actividades con sus evidencias; la IA arma el informe y los documentos de evidencia.</p>
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
          {tab === 'mes' && <MiMesTab perfilCompleto={!!perfil} onIrAConfig={() => setTab('config')} />}
          {tab === 'config' && <ConfiguracionTab perfil={perfil} onPerfilGuardado={setPerfil} />}
          {tab === 'area' && <AreaTab esAdmin={puedeAdmin} />}
          {tab === 'admin' && <AdminTab />}
        </>
      )}
    </div>
  )
}
