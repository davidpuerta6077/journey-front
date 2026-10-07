import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { Copy, Check, RefreshCw, X, UserPlus } from 'lucide-react'
import { regenerateFormLink } from '../../../services/attendance_forms/regenerateFormLink'
import { fetchFormShares } from '../../../services/attendance_forms/fetchFormShares'
import { addFormShare } from '../../../services/attendance_forms/addFormShare'
import { removeFormShare } from '../../../services/attendance_forms/removeFormShare'
import { searchPlatformUsers } from '../../../services/attendance_forms/searchPlatformUsers'
import { confirmAccion, alertError, toastExito } from '../../../services/alerts'

function publicUrl(token) {
  return `${window.location.origin}/f/${token}`
}

export default function ShareModal({ form, onClose }) {
  const [token, setToken] = useState(form.public_token)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const [shares, setShares] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [shareError, setShareError] = useState('')

  const loadShares = useCallback(async () => {
    try {
      setShares(await fetchFormShares(form.id))
    } catch (e) {
      setShareError(e.message)
    }
  }, [form.id])

  useEffect(() => { loadShares() }, [loadShares])

  useEffect(() => {
    if (!token) return
    QRCode.toDataURL(publicUrl(token), { width: 240 }).then(setQrDataUrl)
  }, [token])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const timer = setTimeout(() => {
      searchPlatformUsers(query.trim())
        .then(setResults)
        .catch(e => setShareError(e.message))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleAddShare = async (user) => {
    setShareError('')
    try {
      await addFormShare(form.id, user.id)
      setQuery('')
      setResults([])
      await loadShares()
    } catch (e) {
      setShareError(e.message)
    }
  }

  const handleRemoveShare = async (userId) => {
    try {
      await removeFormShare(form.id, userId)
      await loadShares()
    } catch (e) {
      setShareError(e.message)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    const ok = await confirmAccion({
      title: '¿Regenerar el link?',
      text: 'El link actual dejará de funcionar.',
      confirmButtonText: 'Sí, regenerar',
    })
    if (!ok) return
    setRegenerating(true)
    try {
      const updated = await regenerateFormLink(form.id)
      setToken(updated.public_token)
      toastExito('Link regenerado')
    } catch (e) {
      alertError(e.message)
    }
    setRegenerating(false)
  }

  const handleDownloadQr = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qr_${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
    link.click()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Compartir "{form.title}"</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="modal-section-title">Link público</div>
          {token ? (
            <>
              <p className="modal-hint">Cualquiera con este link puede registrar su asistencia, sin iniciar sesión.</p>
              <div className="link-share-box">
                <input readOnly value={publicUrl(token)} onFocus={e => e.target.select()} />
                <button className="btn-icon" onClick={handleCopy} title="Copiar link">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {qrDataUrl && (
                <div className="qr-box">
                  <img src={qrDataUrl} alt="Código QR del formulario" />
                  <div className="modal-actions" style={{ justifyContent: 'center', marginTop: 10 }}>
                    <button className="btn-secondary" onClick={handleDownloadQr}>Descargar QR</button>
                  </div>
                </div>
              )}

              <button className="btn-secondary" onClick={handleRegenerate} disabled={regenerating} style={{ marginTop: 6 }}>
                <RefreshCw size={14} /> {regenerating ? 'Regenerando...' : 'Regenerar link (invalida el anterior)'}
              </button>
            </>
          ) : (
            <p className="modal-hint">El link público aparece aquí cuando publiques el formulario.</p>
          )}

          <div className="modal-section-title">Compartir con usuarios de Nexo</div>
          <p className="modal-hint">Pueden ver los inscritos y descargar el Excel, pero no editar el formulario.</p>
          {shareError && <div className="modal-error">{shareError}</div>}

          <div className="question-options">
            {shares.map(s => (
              <span className="option-chip" key={s.user_id}>
                {s.username || s.email}
                <button onClick={() => handleRemoveShare(s.user_id)} title="Quitar"><X size={12} /></button>
              </span>
            ))}
            {shares.length === 0 && <span className="public-form-help">Aún no se compartió con nadie.</span>}
          </div>

          <div className="modal-field" style={{ position: 'relative', marginTop: 8 }}>
            <label>Buscar por nombre de usuario o correo</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej. Evelyn o programador.digital@..." />
            {query.trim().length >= 2 && (
              <div className="col-filter-list" style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4, maxHeight: 160 }}>
                {searching && <div className="col-filter-empty">Buscando...</div>}
                {!searching && results.length === 0 && <div className="col-filter-empty">Sin resultados</div>}
                {!searching && results.filter(u => !shares.some(s => s.user_id === u.id)).map(u => (
                  <button key={u.id} className="col-filter-opt" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleAddShare(u)}>
                    <UserPlus size={12} /> <span>{u.username} — {u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
