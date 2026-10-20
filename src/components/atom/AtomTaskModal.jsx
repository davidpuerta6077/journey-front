import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Plus, Trash2, Send } from 'lucide-react'
import { fetchTask } from '../../services/atom/fetchTask'
import { createTask } from '../../services/atom/createTask'
import { updateTask } from '../../services/atom/updateTask'
import { addTaskComment } from '../../services/atom/addTaskComment'
import { toggleSubtask } from '../../services/atom/toggleSubtask'
import { fetchAssignableUsers } from '../../services/atom/fetchAssignableUsers'
import { alertError, toastExito } from '../../services/alerts'
import { ESTADOS, PRIORIDADES } from './atomConstants'

const EMPTY = { title: '', description: '', priority: 'Media', status: 'Pendiente', category: '', due_date: '', assigned_to: null, assigned_to_nombre: '' }

function formatFechaHora(v) {
  if (!v) return ''
  const f = new Date(v)
  return Number.isNaN(f.getTime()) ? '' : f.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AtomTaskModal({ id, nuevo, puedeAsignar, onClose, onSaved }) {
  const [loading, setLoading] = useState(!nuevo)
  const [form, setForm] = useState(EMPTY)
  const [detalle, setDetalle] = useState(null) // solo en edición: subtasks/comments/history/metadata
  const [subtareasNuevas, setSubtareasNuevas] = useState([])
  const [subtareaTexto, setSubtareaTexto] = useState('')
  const [tab, setTab] = useState('detalle')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [asignadoQuery, setAsignadoQuery] = useState('')
  const [asignadoResultados, setAsignadoResultados] = useState([])
  const debounceRef = useRef(null)

  const cargar = useCallback(() => {
    if (nuevo) return
    setLoading(true)
    fetchTask(id)
      .then((t) => {
        setDetalle(t)
        setForm({
          title: t.title, description: t.description || '', priority: t.priority, status: t.status,
          category: t.category || '', due_date: t.due_date ? String(t.due_date).slice(0, 10) : '',
          assigned_to: t.assigned_to, assigned_to_nombre: t.assigned_to_nombre || '',
        })
      })
      .catch((e) => { alertError(e.message); onClose() })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, nuevo])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!asignadoQuery.trim()) { setAsignadoResultados([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchAssignableUsers(asignadoQuery.trim()).then(setAsignadoResultados).catch(() => setAsignadoResultados([]))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [asignadoQuery])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const seleccionarAsignado = (u) => {
    setForm((f) => ({ ...f, assigned_to: u.id, assigned_to_nombre: u.username }))
    setAsignadoQuery(''); setAsignadoResultados([])
  }
  const quitarAsignado = () => setForm((f) => ({ ...f, assigned_to: null, assigned_to_nombre: '' }))

  const agregarSubtareaNueva = () => {
    if (!subtareaTexto.trim()) return
    setSubtareasNuevas((s) => [...s, subtareaTexto.trim()])
    setSubtareaTexto('')
  }
  const quitarSubtareaNueva = (i) => setSubtareasNuevas((s) => s.filter((_, idx) => idx !== i))

  const handleToggleSubtask = async (sub) => {
    try {
      await toggleSubtask(id, sub.id, !sub.done)
      cargar()
    } catch (e) {
      alertError(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Escribe un título para la tarea.'); return }
    setError('')
    setSaving(true)
    try {
      if (nuevo) {
        await createTask({
          title: form.title, description: form.description, priority: form.priority, status: form.status,
          category: form.category, due_date: form.due_date || null, assigned_to: form.assigned_to,
          subtasks: subtareasNuevas,
        })
        toastExito('Tarea creada')
      } else {
        await updateTask(id, {
          title: form.title, description: form.description, priority: form.priority, status: form.status,
          category: form.category, due_date: form.due_date || null, assigned_to: form.assigned_to,
        })
        toastExito('Tarea actualizada')
      }
      onSaved()
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  const handleClose = async () => {
    onClose()
  }

  const [comentario, setComentario] = useState('')
  const enviarComentario = async () => {
    if (!comentario.trim()) return
    try {
      await addTaskComment(id, comentario.trim())
      setComentario('')
      cargar()
    } catch (e) {
      alertError(e.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>{nuevo ? 'Nueva tarea' : 'Detalle de la tarea'}</h3>
          <button className="modal-close" onClick={handleClose}><X size={16} /></button>
        </div>

        {loading ? (
          <div className="loading-box" style={{ padding: 24 }}><span className="loader"></span></div>
        ) : (
          <>
            {!nuevo && (
              <div className="atom-tabs">
                <button type="button" className={`atom-tab-btn ${tab === 'detalle' ? 'active' : ''}`} onClick={() => setTab('detalle')}>Detalle</button>
                <button type="button" className={`atom-tab-btn ${tab === 'comentarios' ? 'active' : ''}`} onClick={() => setTab('comentarios')}>Comentarios ({detalle?.comments?.length || 0})</button>
                <button type="button" className={`atom-tab-btn ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>Historial</button>
              </div>
            )}

            {(nuevo || tab === 'detalle') && (
              <div className="modal-form">
                {error && <div className="modal-error">{error}</div>}
                <div className="modal-field">
                  <label>Título *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="¿Qué hay que hacer?" />
                </div>
                <div className="modal-field">
                  <label>Descripción</label>
                  <textarea name="description" rows={3} value={form.description} onChange={handleChange} />
                </div>
                <div className="atom-detail-grid">
                  <div className="modal-field">
                    <label>Prioridad</label>
                    <select name="priority" value={form.priority} onChange={handleChange}>
                      {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Estado</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Fecha límite</label>
                    <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
                  </div>
                  <div className="modal-field">
                    <label>Categoría / proyecto</label>
                    <input name="category" value={form.category} onChange={handleChange} placeholder="Opcional" />
                  </div>
                </div>

                <div className="modal-field" style={{ position: 'relative' }}>
                  <label>Responsable</label>
                  {form.assigned_to ? (
                    <div className="filters-bar" style={{ padding: 0 }}>
                      <span className="badge badge-synced">{form.assigned_to_nombre}</span>
                      {puedeAsignar && <button type="button" className="btn-icon" onClick={quitarAsignado}><X size={13} /></button>}
                    </div>
                  ) : puedeAsignar ? (
                    <input placeholder="Buscar compañero por nombre o correo..." value={asignadoQuery} onChange={(e) => setAsignadoQuery(e.target.value)} />
                  ) : (
                    <p className="modal-hint">Sin asignar (tarea personal)</p>
                  )}
                  {asignadoResultados.length > 0 && (
                    <div className="nav-search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5 }}>
                      {asignadoResultados.map((u) => (
                        <button key={u.id} type="button" className="nav-search-item" onClick={() => seleccionarAsignado(u)}>
                          <span className="nav-search-item-label">{u.username}</span>
                          <span className="nav-search-item-breadcrumb">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!nuevo && detalle && (
                  <p className="modal-hint">Creado por {detalle.created_by_nombre} — {formatFechaHora(detalle.created_at)}</p>
                )}

                <div className="modal-field">
                  <label>Subtareas</label>
                  <div className="atom-subtasks-list">
                    {!nuevo && (detalle?.subtasks || []).map((s) => (
                      <label key={s.id} className={`atom-subtask-row ${s.done ? 'done' : ''}`}>
                        <input type="checkbox" checked={s.done} onChange={() => handleToggleSubtask(s)} />
                        <span>{s.title}</span>
                      </label>
                    ))}
                    {nuevo && subtareasNuevas.map((s, i) => (
                      <div key={i} className="atom-subtask-row">
                        <span>• {s}</span>
                        <button type="button" className="btn-icon" onClick={() => quitarSubtareaNueva(i)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                  {nuevo && (
                    <div className="modal-row">
                      <input placeholder="Agregar subtarea..." value={subtareaTexto} onChange={(e) => setSubtareaTexto(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarSubtareaNueva())} />
                      <button type="button" className="btn-secondary" onClick={agregarSubtareaNueva}><Plus size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!nuevo && tab === 'comentarios' && (
              <div className="modal-form">
                <div className="atom-comments-list">
                  {(detalle?.comments || []).length === 0 && <p className="atom-empty">Sin comentarios todavía.</p>}
                  {(detalle?.comments || []).map((c) => (
                    <div key={c.id} className="atom-comment">
                      <strong>{c.usuario_nombre}</strong>
                      {c.body}
                      <div><time>{formatFechaHora(c.created_at)}</time></div>
                    </div>
                  ))}
                </div>
                <div className="modal-row">
                  <input placeholder="Escribe un comentario..." value={comentario} onChange={(e) => setComentario(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), enviarComentario())} />
                  <button type="button" className="btn-primary" onClick={enviarComentario}><Send size={14} /></button>
                </div>
              </div>
            )}

            {!nuevo && tab === 'historial' && (
              <div className="modal-form">
                <div className="atom-history-list">
                  {(detalle?.history || []).length === 0 && <p className="atom-empty">Sin cambios registrados.</p>}
                  {(detalle?.history || []).map((h) => (
                    <div key={h.id}>
                      <strong>{h.usuario_nombre || 'Sistema'}</strong> cambió <b>{h.campo}</b>: {h.anterior || '—'} → {h.actual || '—'}
                      <div style={{ opacity: .7 }}>{formatFechaHora(h.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(nuevo || tab === 'detalle') && (
              <div className="modal-actions">
                <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Guardando...' : nuevo ? 'Crear tarea' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
