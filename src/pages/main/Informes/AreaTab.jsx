import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import { getUsuariosArea } from '../../../services/onix/getUsuariosArea'
import { alertError } from '../../../services/alerts'
import MiMesTab from './MiMesTab'
import { MESES, periodoActual, aniosDisponibles } from './periodo'

export default function AreaTab({ esAdmin }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [viendo, setViendo] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setUsuarios(await getUsuariosArea(periodo))
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  if (viendo) {
    return (
      <div>
        <div className="onix-toolbar">
          <button className="btn-secondary" onClick={() => setViendo(null)}><ArrowLeft size={16} /> Volver</button>
          <h3>{viendo.nombre}{viendo.area_nombre ? ` · ${viendo.area_nombre}` : ''}</h3>
        </div>
        <MiMesTab userId={viendo.user_id} soloLectura />
      </div>
    )
  }

  return (
    <div>
      <div className="onix-toolbar">
        <h3>{esAdmin ? 'Informes de todos los usuarios' : 'Informes de mi área'}</h3>
        <div className="onix-filtros">
          <select className="filter-select" aria-label="Mes" value={periodo.mes} onChange={(e) => setPeriodo({ ...periodo, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" aria-label="Año" value={periodo.anio} onChange={(e) => setPeriodo({ ...periodo, anio: Number(e.target.value) })}>
            {aniosDisponibles().map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : usuarios.length === 0 ? (
        <p className="onix-vacio">
          {esAdmin ? 'Nadie ha completado su perfil de informes todavía.' : 'No hay usuarios en tu área. Si no ves a nadie, revisa que tu perfil tenga un área asignada.'}
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Nombre</th><th>Identificación</th><th>Área</th><th>Subactividades del mes</th><th>Redactadas con IA</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.user_id}>
                  <td data-label="Nombre">{u.nombre}<br /><small>{u.email}</small></td>
                  <td data-label="Identificación">{u.identificacion}</td>
                  <td data-label="Área">{u.area_nombre || '—'}</td>
                  <td data-label="Subactividades del mes">{u.registros}</td>
                  <td data-label="Redactadas con IA"><span className={u.registros > 0 && u.generados === u.registros ? 'badge badge-synced' : 'badge badge-pending'}>{u.generados}</span></td>
                  <td data-label="Acciones">
                    <button className="btn-icon" title="Ver informes" aria-label={`Ver informes de ${u.nombre}`} onClick={() => setViendo(u)}><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
