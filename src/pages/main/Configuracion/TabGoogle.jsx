import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import config from '../../../config'
import { fetchGoogleConfig } from '../../../services/settings/fetchGoogleConfig'
import { saveGoogleConfig } from '../../../services/settings/saveGoogleConfig'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'

// Lo que hay que registrar en Google Cloud si no se escribió otro valor.
const RETORNO_SUGERIDO = `${config.api_domain.url_base.replace(/\/$/, '')}/onix/google/callback`
const FRONT_SUGERIDO = window.location.origin

// Credencial OAuth de Google para que cada usuario conecte su Google Calendar
// en Informes (Onix-IA). El secreto se guarda cifrado y nunca se vuelve a mostrar.
export default function TabGoogle() {
  const [form, setForm] = useState({ client_id: '', client_secret: '', redirect_uri: '', front_url: '' })
  const [secreto, setSecreto] = useState({ configurado: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const aplicar = (c) => {
    setForm({ client_id: c.client_id, client_secret: '', redirect_uri: c.redirect_uri || RETORNO_SUGERIDO, front_url: c.front_url || FRONT_SUGERIDO })
    setSecreto(c.secreto)
  }

  useEffect(() => {
    fetchGoogleConfig().then(aplicar).catch((e) => alertError(e.message)).finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async (extra = {}) => {
    setSaving(true)
    try {
      await saveGoogleConfig({ ...form, ...extra })
      toastExito('Credencial de Google guardada')
      aplicar(await fetchGoogleConfig())
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  const quitarSecreto = async () => {
    const ok = await confirmAccion({ title: '¿Quitar el secreto?', text: 'Nadie podrá conectar ni leer su Google Calendar hasta que se ingrese otro (salvo que el servidor tenga uno en su .env).', confirmButtonText: 'Sí, quitar' })
    if (ok) guardar({ client_secret: '', quitar_secreto: true })
  }

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto)
      toastExito('Copiado')
    } catch {
      alertError('No se pudo copiar; selecciónalo y cópialo a mano')
    }
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="modal-form" style={{ maxWidth: 620 }}>
      <p className="modal-hint">
        Permite que cada usuario conecte su Google Calendar en Informes (Onix-IA) para traer sus reuniones y eventos del mes.
        Bravo Hub solo lee el calendario.
      </p>
      <ol className="modal-hint" style={{ paddingLeft: 18, margin: 0 }}>
        <li>En console.cloud.google.com, en <strong>APIs y servicios &gt; Biblioteca</strong>, habilita <strong>Google Calendar API</strong>.</li>
        <li>En <strong>Credenciales</strong>, crea (o abre) un <strong>ID de cliente OAuth</strong> de tipo <strong>Aplicación web</strong>.</li>
        <li>
          En <strong>URIs de redireccionamiento autorizados</strong> agrega exactamente la URL de retorno de abajo{' '}
          <button type="button" className="btn-icon" title="Copiar URL de retorno" aria-label="Copiar URL de retorno" onClick={() => copiar(form.redirect_uri)}><Copy size={14} /></button>
        </li>
        <li>Copia aquí el ID de cliente y el secreto, y guarda.</li>
      </ol>
      <div className="modal-field">
        <label htmlFor="g-id">ID de cliente</label>
        <input id="g-id" name="client_id" value={form.client_id} onChange={handleChange} placeholder="123456-abc.apps.googleusercontent.com" />
      </div>
      <div className="modal-field">
        <label htmlFor="g-secret">Secreto del cliente</label>
        <input id="g-secret" name="client_secret" type="password" autoComplete="off" value={form.client_secret} onChange={handleChange}
          placeholder={secreto.configurado ? 'Dejar vacío para no cambiarlo' : 'GOCSPX-...'} />
        <p className="modal-hint">
          {secreto.configurado
            ? `Configurado (termina en ${secreto.ultimos})${secreto.origen === 'servidor' ? ' — tomado del .env del servidor' : ''}. Se guarda cifrado y nunca se vuelve a mostrar.`
            : 'Sin secreto. Se guarda cifrado y nunca se vuelve a mostrar.'}
        </p>
      </div>
      <div className="modal-field">
        <label htmlFor="g-retorno">URL de retorno (registrarla en Google)</label>
        <input id="g-retorno" name="redirect_uri" value={form.redirect_uri} onChange={handleChange} placeholder={RETORNO_SUGERIDO} />
        <p className="modal-hint">Es la dirección del API de Bravo Hub a la que Google devuelve al usuario. Sugerida: {RETORNO_SUGERIDO}</p>
      </div>
      <div className="modal-field">
        <label htmlFor="g-front">URL de Bravo Hub</label>
        <input id="g-front" name="front_url" value={form.front_url} onChange={handleChange} placeholder={FRONT_SUGERIDO} />
        <p className="modal-hint">A dónde vuelve el usuario después de conectar. Sugerida: {FRONT_SUGERIDO}</p>
      </div>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => guardar()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        {secreto.configurado && secreto.origen === 'hub' && (
          <button className="btn-secondary" onClick={quitarSecreto} disabled={saving}>Quitar secreto</button>
        )}
      </div>
    </div>
  )
}
