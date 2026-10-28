import { useEffect, useState } from 'react'
import { getAreas } from '../../../services/onix/getAreas'
import { savePerfil } from '../../../services/onix/savePerfil'
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
    <form className="onix-panel-form modal-form" onSubmit={guardar}>
      {!perfil && (
        <p className="onix-aviso">Completa tu perfil para poder generar informes. Estos datos aparecen en el Word.</p>
      )}
      <div className="modal-row">
        <div className="modal-field">
          <label htmlFor="perfil-1">Nombre completo *</label>
          <input id="perfil-1" value={form.nombre} onChange={set('nombre')} maxLength={200} required />
        </div>
        <div className="modal-field">
          <label htmlFor="perfil-2">Identificación *</label>
          <input id="perfil-2" value={form.identificacion} onChange={set('identificacion')} maxLength={50} required />
        </div>
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label htmlFor="perfil-3">Área</label>
          <select id="perfil-3" value={form.area_id} onChange={set('area_id')}>
            <option value="">Selecciona tu área</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="modal-field">
          <label htmlFor="perfil-4">Número de contrato</label>
          <input id="perfil-4" value={form.contrato} onChange={set('contrato')} maxLength={100} placeholder="Ej: VAD 191" />
        </div>
      </div>
      <div className="modal-field">
        <label htmlFor="perfil-5">Objeto contractual</label>
        <textarea id="perfil-5" rows={4} value={form.objeto} onChange={set('objeto')} />
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </form>
  )
}
