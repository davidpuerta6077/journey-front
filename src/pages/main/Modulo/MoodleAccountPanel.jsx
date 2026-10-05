import { useState, useEffect, useCallback } from 'react'
import { LockOpen, ShieldOff } from 'lucide-react'
import { getMoodleStatus } from '../../../services/usuarios/getMoodleStatus'
import { unlockMoodleUser } from '../../../services/usuarios/unlockMoodleUser'
import { resetMoodleMfa } from '../../../services/usuarios/resetMoodleMfa'

const ACTIONS = {
  unlock: {
    label: 'Desbloquear en Moodle', icon: LockOpen, run: unlockMoodleUser, can: 'canunlock', reason: 'unlockreason',
    confirm: (nombre) => `¿Desbloquear la cuenta de Moodle de ${nombre}? Podrá volver a intentar ingresar de inmediato.`,
  },
  resetmfa: {
    label: 'Reiniciar doble factor', icon: ShieldOff, run: resetMoodleMfa, can: 'canresetmfa', reason: 'resetmfareason',
    confirm: (nombre) => `¿Reiniciar el doble factor de ${nombre}? Se eliminarán sus factores configurados y deberá configurarlos de nuevo al ingresar.`,
  },
}

// Estado de la cuenta en Moodle (plugin local_nexo) y acciones de desbloqueo / reinicio de doble factor.
export default function MoodleAccountPanel({ user }) {
  const [status, setStatus]         = useState(null)
  const [error, setError]           = useState(null)
  const [hidden, setHidden]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [confirming, setConfirming] = useState(null)
  const [running, setRunning]       = useState(false)
  const [message, setMessage]       = useState(null)

  const fetchStatus = useCallback(() => getMoodleStatus(user.id)
    .then(s => { setStatus(s); setError(null) })
    .catch(e => { if (e.status === 403) setHidden(true); else setError(e.message) })
    .finally(() => setLoading(false)), [user.id])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const runAction = async () => {
    setRunning(true)
    try {
      const result = await ACTIONS[confirming].run(user.id)
      setMessage({ ok: true, text: result.message })
    } catch (e) {
      setMessage({ ok: false, text: e.message })
    } finally {
      setRunning(false)
      setConfirming(null)
      fetchStatus()
    }
  }

  if (hidden) return null

  const reasons = status ? [...new Set(Object.values(ACTIONS).map(a => status[a.reason]).filter(Boolean))] : []

  return (
    <section className="moodle-account" aria-label="Cuenta en Moodle">
      <h4 className="user-detail-subtitle">Cuenta en Moodle</h4>
      {loading ? (
        <div className="loading-box" style={{ padding: '1rem' }}><span className="loader"></span>Consultando Moodle...</div>
      ) : error ? (
        <p className="user-detail-empty">{error}</p>
      ) : (
        <>
          <div className="expand-grid user-detail-grid">
            <div className="expand-item">
              <span className="expand-label">Estado de acceso</span>
              <span className="expand-value">
                <span className={`badge ${status.locked ? 'badge-error' : 'badge-success'}`}>{status.locked ? 'Bloqueado' : 'Sin bloqueo'}</span>
              </span>
            </div>
            <div className="expand-item">
              <span className="expand-label">Doble factor</span>
              <span className="expand-value">
                {status.mfalocked && <span className="badge badge-error">Bloqueado por doble factor</span>}{' '}
                {status.mfafactors === 0 ? 'Sin factores configurados' : `${status.mfafactors} factor${status.mfafactors === 1 ? '' : 'es'} configurado${status.mfafactors === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>

          <div className="moodle-account-actions">
            {Object.entries(ACTIONS).map(([key, action]) => {
              const Icon = action.icon
              return (
                <button key={key} type="button" className="btn-secondary"
                  disabled={!status[action.can] || running}
                  title={status[action.reason] || undefined}
                  onClick={() => { setMessage(null); setConfirming(key) }}>
                  <Icon size={15} aria-hidden="true" /> {action.label}
                </button>
              )
            })}
          </div>
          {reasons.map(r => <p key={r} className="moodle-account-hint">{r}</p>)}

          {confirming && (
            <div className="moodle-account-confirm" role="alertdialog" aria-label="Confirmar acción en Moodle">
              <p>{ACTIONS[confirming].confirm(user.nombre)}</p>
              <div className="moodle-account-actions">
                <button type="button" className="btn-secondary" onClick={() => setConfirming(null)} disabled={running}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={runAction} disabled={running}>{running ? 'Procesando...' : 'Confirmar'}</button>
              </div>
            </div>
          )}
          {message && <p className={message.ok ? 'moodle-account-ok' : 'moodle-account-error'} role="status">{message.text}</p>}
        </>
      )}
    </section>
  )
}
