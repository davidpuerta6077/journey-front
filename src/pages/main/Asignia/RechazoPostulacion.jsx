import { useState } from 'react'
import { XCircle } from 'lucide-react'
import { rechazarPostulacion } from '../../../services/asignia/rechazarPostulacion'
import { alertError, toastExito } from '../../../services/alerts'
import { CAUSALES_RECHAZO } from './asigniaUtil'

// Rechazo en línea de una postulación: causal obligatoria + comentario
// (obligatorio si la causal es "Otro"). El profesor ve ambos en su pantalla.
export default function RechazoPostulacion({ postulacion, onCancelar, onHecho }) {
  const [causal, setCausal] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const valido = causal && (causal !== 'Otro' || motivo.trim())
  const id = `rechazo-${postulacion.id}`

  const rechazar = async () => {
    setEnviando(true)
    try {
      await rechazarPostulacion(postulacion.id, { causal, motivo: motivo.trim() })
      toastExito('Postulación rechazada')
      onHecho()
    } catch (e) {
      alertError(e.message)
      setEnviando(false)
    }
  }

  return (
    <div className="asignia-rechazo-form">
      <p className="asignia-ayuda">{postulacion.nombre} no quedará con este curso y no podrá volver a postularse a él. Verá el motivo en su pantalla.</p>
      <div className="modal-field">
        <label htmlFor={`${id}-causal`}>Causal del rechazo</label>
        <select id={`${id}-causal`} value={causal} onChange={(e) => setCausal(e.target.value)}>
          <option value="">Selecciona una causal</option>
          {CAUSALES_RECHAZO.map(c => <option key={c} value={c}>{c === 'Otro' ? 'Otro (requiere observación)' : c}</option>)}
        </select>
      </div>
      <div className="modal-field">
        <label htmlFor={`${id}-comentario`}>Comentario {causal === 'Otro' ? '(obligatorio)' : '(opcional)'}</label>
        <textarea id={`${id}-comentario`} rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      <div className="asignia-post-acciones">
        <button type="button" className="btn-secondary asignia-btn-fila" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="button" className="btn-secondary asignia-btn-fila asignia-btn-peligro" onClick={rechazar} disabled={!valido || enviando}>
          <XCircle size={15} /> {enviando ? 'Rechazando...' : 'Rechazar postulación'}
        </button>
      </div>
    </div>
  )
}
