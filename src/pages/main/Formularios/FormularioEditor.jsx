import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowDown, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { fetchFormDetail } from '../../../services/attendance_forms/fetchFormDetail'
import { createForm } from '../../../services/attendance_forms/createForm'
import { updateForm } from '../../../services/attendance_forms/updateForm'
import QuestionField from './QuestionField'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Formularios/Formularios.css'

const QUESTION_TYPES = [
  { value: 'texto_corto', label: 'Texto corto' },
  { value: 'texto_largo', label: 'Texto largo' },
  { value: 'numero', label: 'Número' },
  { value: 'correo', label: 'Correo' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'seleccion_unica', label: 'Selección única' },
  { value: 'seleccion_multiple', label: 'Selección múltiple' },
  { value: 'lista_desplegable', label: 'Lista desplegable' },
  { value: 'aceptacion', label: 'Casilla de aceptación' },
]
const TYPES_WITH_OPTIONS = ['seleccion_unica', 'seleccion_multiple', 'lista_desplegable']

const DEFAULT_QUESTIONS = [
  { key: 'd1', label: 'Nombre completo', type: 'texto_corto', required: true, options: null, help_text: '' },
  { key: 'd2', label: 'Número de documento', type: 'numero', required: true, options: null, help_text: '' },
  { key: 'd3', label: 'Correo', type: 'correo', required: true, options: null, help_text: '' },
  { key: 'd4', label: 'Teléfono', type: 'telefono', required: false, options: null, help_text: '' },
  { key: 'd5', label: 'Programa / Facultad', type: 'texto_corto', required: false, options: null, help_text: '' },
]

const EMPTY_FORM = {
  title: '', description: '', event_date: '', location: '', modality: 'presencial',
  opens_at: '', closes_at: '', max_capacity: '',
}

let tmpCounter = 0
const newKey = () => `tmp-${Date.now()}-${tmpCounter++}`

function toDbQuestions(questions) {
  return questions.map((q, i) => ({
    id: q.dbId,
    label: q.label,
    type: q.type,
    options: TYPES_WITH_OPTIONS.includes(q.type) ? (q.options || []) : null,
    required: !!q.required,
    help_text: q.help_text || null,
    position: i,
  }))
}

export default function FormularioEditor() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [isOwner, setIsOwner] = useState(true)

  const load = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const detail = await fetchFormDetail(id)
      setIsOwner(!!detail.is_owner)
      setForm({
        title: detail.title || '',
        description: detail.description || '',
        event_date: detail.event_date ? detail.event_date.slice(0, 16) : '',
        location: detail.location || '',
        modality: detail.modality || 'presencial',
        opens_at: detail.opens_at ? detail.opens_at.slice(0, 16) : '',
        closes_at: detail.closes_at ? detail.closes_at.slice(0, 16) : '',
        max_capacity: detail.max_capacity ?? '',
      })
      setQuestions((detail.questions || []).map(q => ({
        key: `db-${q.id}`, dbId: q.id, label: q.label, type: q.type,
        required: q.required, options: q.options || null, help_text: q.help_text || '',
      })))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [id, isEdit])

  useEffect(() => { load() }, [load])

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const addQuestion = () => {
    setQuestions([...questions, { key: newKey(), label: '', type: 'texto_corto', required: false, options: null, help_text: '' }])
  }

  const removeQuestion = (idx) => {
    if (!confirm('¿Quitar esta pregunta del formulario?')) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const moveQuestion = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= questions.length) return
    const copy = [...questions]
    ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
    setQuestions(copy)
  }

  const updateQuestion = (idx, field, value) => {
    const copy = [...questions]
    copy[idx] = { ...copy[idx], [field]: value }
    if (field === 'type' && !TYPES_WITH_OPTIONS.includes(value)) copy[idx].options = null
    if (field === 'type' && TYPES_WITH_OPTIONS.includes(value) && !copy[idx].options) copy[idx].options = []
    setQuestions(copy)
  }

  const addOption = (idx, text) => {
    if (!text.trim()) return
    const copy = [...questions]
    copy[idx] = { ...copy[idx], options: [...(copy[idx].options || []), text.trim()] }
    setQuestions(copy)
  }

  const removeOption = (idx, optIdx) => {
    const copy = [...questions]
    copy[idx] = { ...copy[idx], options: copy[idx].options.filter((_, i) => i !== optIdx) }
    setQuestions(copy)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio.'); return }
    if (questions.some(q => !q.label.trim())) { setError('Toda pregunta debe tener un texto.'); return }
    if (questions.some(q => TYPES_WITH_OPTIONS.includes(q.type) && (!q.options || q.options.length < 2))) {
      setError('Las preguntas de selección necesitan al menos 2 opciones.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        max_capacity: form.max_capacity === '' ? null : Number(form.max_capacity),
        questions: toDbQuestions(questions),
      }
      await (isEdit ? updateForm(id, payload) : createForm(payload))
      navigate('/formularios')
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="sync-page"><div className="loading-box"><span className="loader"></span>Cargando...</div></div>

  if (isEdit && !isOwner) {
    return (
      <div className="sync-page">
        <div className="sync-error">No tienes permiso para editar este formulario — solo el creador puede hacerlo.</div>
        <button className="btn-secondary" onClick={() => navigate(`/formularios/${id}/inscritos`)}>Ver inscritos</button>
      </div>
    )
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>{isEdit ? 'Editar Formulario' : 'Crear Formulario'}</h2>
        <div className="action-btns">
          <button className="btn-secondary" onClick={() => setPreview(p => !p)}>
            {preview ? <EyeOff size={14} /> : <Eye size={14} />} {preview ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/formularios')}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>

      {error && <div className="sync-error">{error}</div>}

      {preview ? (
        <div className="form-preview-box">
          <h1 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{form.title || 'Título del formulario'}</h1>
          {form.description && <p className="public-form-description">{form.description}</p>}
          <div className="form-meta">
            {form.event_date && <span>📅 {new Date(form.event_date).toLocaleString('es-CO')}</span>}
            {form.location && <span>📍 {form.location}</span>}
            {form.max_capacity && <span>Cupo: {form.max_capacity}</span>}
          </div>
          <div className="public-form-body">
            {questions.map(q => <QuestionField key={q.key} question={q} value={undefined} onChange={() => {}} disabled />)}
          </div>
        </div>
      ) : (
        <>
          <div className="modal-form" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div className="modal-section-title">Datos del formulario</div>
            <div className="modal-field">
              <label>Título *</label>
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ej. Charla de bienvenida 2026-1" />
            </div>
            <div className="modal-field">
              <label>Descripción</label>
              <input name="description" value={form.description} onChange={handleFormChange} />
            </div>
            <div className="modal-row">
              <div className="modal-field">
                <label>Fecha y hora del evento</label>
                <input type="datetime-local" name="event_date" value={form.event_date} onChange={handleFormChange} />
              </div>
              <div className="modal-field">
                <label>Lugar / modalidad</label>
                <select name="modality" value={form.modality} onChange={handleFormChange}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
            </div>
            <div className="modal-field">
              <label>Lugar (dirección o link de la sesión)</label>
              <input name="location" value={form.location} onChange={handleFormChange} />
            </div>
            <div className="modal-row">
              <div className="modal-field">
                <label>Apertura (opcional)</label>
                <input type="datetime-local" name="opens_at" value={form.opens_at} onChange={handleFormChange} />
              </div>
              <div className="modal-field">
                <label>Cierre (opcional)</label>
                <input type="datetime-local" name="closes_at" value={form.closes_at} onChange={handleFormChange} />
              </div>
              <div className="modal-field">
                <label>Cupo máximo (opcional)</label>
                <input type="number" min="1" name="max_capacity" value={form.max_capacity} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <div className="modal-section-title" style={{ marginTop: 20 }}>Preguntas</div>
          <div className="question-builder">
            {questions.map((q, idx) => (
              <div className="question-card" key={q.key}>
                <div className="question-card-head">
                  <div className="question-reorder">
                    <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Subir"><ArrowUp size={12} /></button>
                    <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Bajar"><ArrowDown size={12} /></button>
                  </div>
                  <div className="modal-field">
                    <label>Pregunta</label>
                    <input value={q.label} onChange={e => updateQuestion(idx, 'label', e.target.value)} placeholder="Texto de la pregunta" />
                  </div>
                  <div className="modal-field question-type-field">
                    <label>Tipo</label>
                    <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <label className="question-required-toggle">
                    <input type="checkbox" checked={!!q.required} onChange={e => updateQuestion(idx, 'required', e.target.checked)} />
                    Obligatoria
                  </label>
                  <button className="btn-icon btn-icon-delete question-remove-btn" title="Quitar pregunta" onClick={() => removeQuestion(idx)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="modal-field">
                  <label>Texto de ayuda (opcional){q.type === 'aceptacion' ? ' — se muestra junto a la casilla' : ''}</label>
                  <input value={q.help_text} onChange={e => updateQuestion(idx, 'help_text', e.target.value)} />
                </div>

                {TYPES_WITH_OPTIONS.includes(q.type) && (
                  <OptionsEditor
                    options={q.options || []}
                    onAdd={(text) => addOption(idx, text)}
                    onRemove={(optIdx) => removeOption(idx, optIdx)}
                  />
                )}
              </div>
            ))}
          </div>
          <button className="btn-secondary add-question-bar" onClick={addQuestion}>
            <Plus size={14} /> Agregar pregunta
          </button>
        </>
      )}
    </div>
  )
}

function OptionsEditor({ options, onAdd, onRemove }) {
  const [text, setText] = useState('')
  return (
    <div className="question-options">
      {options.map((opt, i) => (
        <span className="option-chip" key={`${opt}-${i}`}>
          {opt}
          <button onClick={() => onRemove(i)}>✕</button>
        </span>
      ))}
      <div className="option-add-input">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Nueva opción"
          onKeyDown={e => { if (e.key === 'Enter') { onAdd(text); setText('') } }} />
        <button className="btn-secondary" onClick={() => { onAdd(text); setText('') }}>Agregar</button>
      </div>
    </div>
  )
}
