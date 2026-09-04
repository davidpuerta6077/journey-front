import { ScrollText } from 'lucide-react'
import "../../../styles/main/Sync/SyncUsuariosP.css"

export default function AdminLogs() {
  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Administrador — Logs</h2>
      </div>
      <div className="loading-box" style={{ color: '#94a3b8' }}>
        <ScrollText size={32} strokeWidth={1.5} />
        <span>Próximamente — todavía no hay registros de auditoría configurados.</span>
      </div>
    </div>
  )
}
