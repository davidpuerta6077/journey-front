import { useEffect, useState } from 'react'
import { getLogsDisponibles } from '../../../services/onix/getLogsDisponibles'
import { createRegistroDesdeLogs } from '../../../services/onix/createRegistroDesdeLogs'
import { alertError, toastExito } from '../../../services/alerts'
import { MESES } from './periodo'

const fechaHora = (d) => new Date(d).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// Lista las acciones propias del mes en Bravo Hub (logs) que aún no se han
// asignado y junta las elegidas en un solo registro de la actividad.
export default function TraerLogsModal({ actividad, periodo, onClose, onAgregado }) {
  const [logs, setLogs] = useState(null)
  const [elegidos, setElegidos] = useState(new Set())
  const [enviando, setEnviando] = useState(false)
  const [titulo, setTitulo] = useState('Acciones en Bravo Hub')

  useEffect(() => {
    getLogsDisponibles(periodo)
      .then(setLogs)
      .catch((e) => { alertError(e.message); setLogs([]) })
  }, [periodo])

  const alternar = (id) => setElegidos((prev) => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    return s
  })

  const todos = logs?.length > 0 && elegidos.size === logs.length
  const alternarTodos = () => setElegidos(todos ? new Set() : new Set(logs.map((l) => l.id)))

  const agregar = async () => {
    setEnviando(true)
    try {
      await createRegistroDesdeLogs({ actividad_id: actividad.id, ...periodo, titulo, log_ids: [...elegidos] })
      toastExito(`${elegidos.size} acción(es) agregada(s) como subactividad`)
      onAgregado()
    } catch (e) {
      alertError(e.message)
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box onix-modal-ancho">
        <div className="modal-header">
          <h3>Mis acciones en Bravo Hub — {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-form">
          <p className="modal-hint">
            Marca lo que hiciste para "{actividad.nombre}". Se agregará como una subactividad (una línea por acción) que luego puedes editar
            y a la que puedes agregar evidencias. Las acciones ya asignadas no aparecen.
          </p>
          <div className="modal-field">
            <label htmlFor="logs-titulo">Título de la subactividad</label>
            <input id="logs-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} />
          </div>
          {logs === null ? (
            <div className="loading-box"><span className="loader"></span>Cargando acciones...</div>
          ) : logs.length === 0 ? (
            <p className="onix-vacio">No tienes acciones pendientes de asignar en este mes.</p>
          ) : (
            <div className="table-wrapper onix-logs-lista">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={todos} onChange={alternarTodos} aria-label="Seleccionar todas" /></th>
                    <th>Fecha</th>
                    <th>Módulo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className={elegidos.has(l.id) ? 'row-selected' : ''} onClick={() => alternar(l.id)} style={{ cursor: 'pointer' }}>
                      <td data-label="Elegir">
                        <input type="checkbox" checked={elegidos.has(l.id)} onChange={() => alternar(l.id)} onClick={(e) => e.stopPropagation()}
                          aria-label={`Elegir: ${l.description}`} />
                      </td>
                      <td data-label="Fecha">{fechaHora(l.date)}</td>
                      <td data-label="Módulo">{l.modulo || l.entity_type || '—'}</td>
                      <td data-label="Acción">{l.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={!elegidos.size || enviando} onClick={agregar}>
            {enviando ? 'Agregando...' : `Agregar a esta actividad${elegidos.size ? ` (${elegidos.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
