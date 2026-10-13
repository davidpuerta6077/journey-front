import { useEffect, useState } from 'react'
import { getAreas, savePerfil } from '../../../services/onix/onixApi'
import { alertError, toastExito } from '../../../services/alerts'

export default function PerfilTab({ perfil, onSaved }) {
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState({
    nombre: perfil?.nombre || '',
    identificacion: perfil?.identificacion || '',
    area_id: perfil?.area_id || '',
    contrato: perfil?.contrato || '',
    objeto: perfil?.objeto || '',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    getAreas().then(setAreas).catch((e) => alertError(e.message))
  }, [])

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const guardado = await savePerfil({ ...form, area_id: form.area_id || null })
      toastExito('Perfil guardado')
      onSaved(guardado)
    } catch (err) {
      alertError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="onix-card modal-form" onSubmit={guardar}>
      {!perfil && (
        <p className="onix-aviso">Completa tu perfil para poder generar informes. Estos datos aparecen en el Word.</p>
      )}
      <div className="modal-row">
        <label className="modal-field">
          <span>Nombre completo *</span>
          <input value={form.nombre} onChange={set('nombre')} maxLength={200} required />
        </label>
        <label className="modal-field">
          <span>Identificación *</span>
          <input value={form.identificacion} onChange={set('identificacion')} maxLength={50} required />
        </label>
      </div>
      <div className="modal-row">
        <label className="modal-field">
          <span>Área</span>
          <select value={form.area_id} onChange={set('area_id')}>
            <option value="">Sin área</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
        <label className="modal-field">
          <span>Número de contrato</span>
          <input value={form.contrato} onChange={set('contrato')} maxLength={100} placeholder="Ej: VAD 191" />
        </label>
      </div>
      <label className="modal-field">
        <span>Objeto contractual</span>
        <textarea rows={4} value={form.objeto} onChange={set('objeto')} />
      </label>
      <div className="modal-actions">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </form>
  )
}
