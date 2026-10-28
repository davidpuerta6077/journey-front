import { CalendarDays, Settings, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../../../services/PermissionsContext'
import { getPerfil } from '../../../services/onix/getPerfil'
import { alertError, toastExito } from '../../../services/alerts'
import MiMesTab from './MiMesTab'
import ConfiguracionTab from './ConfiguracionTab'
import AreaTab from './AreaTab'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Informes/Informes.css'

export default function InformesPage() {
  const { permissions } = usePermissions()
  const tiene = (code) => permissions?.modules?.some((m) => m.submodules.some((s) => s.submodule_code === code))
  const puedeArea = tiene('onix_reports_area')
  const puedeAdmin = tiene('onix_reports_admin')

  const [perfil, setPerfil] = useState(undefined) // undefined = cargando, null = sin perfil
  // Al volver de Google se abre Configuración, donde está la conexión.
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('google') ? 'config' : 'mes'))

  // Al volver de Google (?google=ok|error) se avisa y se limpia la URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const google = q.get('google')
    if (!google) return
    window.history.replaceState(null, '', window.location.pathname)
    if (google === 'ok') toastExito('Google Calendar conectado')
    else alertError(q.get('mensaje') || 'No se pudo conectar con Google')
  }, [])

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
    { id: 'mes', label: 'Mi mes', Icon: CalendarDays },
    { id: 'config', label: 'Configuración', Icon: Settings },
    ...(puedeArea || puedeAdmin ? [{ id: 'area', label: puedeAdmin ? 'Todos los informes' : 'Mi área', Icon: Users }] : []),
  ], [puedeArea, puedeAdmin])

  return (
    <div className="sync-page onix-root">
      <div className="sync-page-header">
        <div>
          <h2>Informes (Onix-IA)</h2>
          <p className="onix-sub">Tu informe mensual de contrato: lo que hiciste, con sus evidencias, redactado por la IA.</p>
        </div>
      </div>

      <div className="onix-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={tab === t.id ? 'onix-tab active' : 'onix-tab'} onClick={() => setTab(t.id)}>
            <t.Icon size={15} aria-hidden="true" /> {t.label}
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
        </>
      )}
    </div>
  )
}
