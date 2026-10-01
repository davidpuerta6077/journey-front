import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublicForm } from '../../../services/attendance_forms/fetchPublicForm'
import { submitPublicResponse } from '../../../services/attendance_forms/submitPublicResponse'
import QuestionField from './QuestionField'
import '../../../styles/main/Formularios/Formularios.css'

const MOTIVOS = {
  no_disponible: 'Este formulario no está disponible.',
  no_abierto: 'Este formulario aún no ha abierto sus inscripciones.',
  cerrado: 'Este formulario ya cerró sus inscripciones.',
  cupo_lleno: 'Este formulario alcanzó su cupo máximo.',
}

export default function FormularioPublico() {
  const { publicToken } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setForm(await fetchPublicForm(publicToken))
    } catch {
      setForm({ disponible: false, motivo: 'no_disponible' })
    }
    setLoading(false)
  }, [publicToken])

  useEffect(() => { load() }, [load])

  const handleChange = (questionId, value) => setAnswers(a => ({ ...a, [questionId]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    for (const q of form.questions) {
      const value = answers[q.id]
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
      if (q.required && (empty || (q.type === 'aceptacion' && value !== true))) {
        setError(`"${q.label}" es obligatorio`)
        return
      }
    }
    setSending(true)
    try {
      await submitPublicResponse(publicToken, Object.entries(answers).map(([question_id, value]) => ({ question_id: Number(question_id), value })))
      setSent(true)
    } catch (e) {
      setError(e.message)
    }
    setSending(false)
  }

  if (loading) {
    return <div className="public-form-page"><div className="public-form-card public-form-state">Cargando formulario...</div></div>
  }

  if (!form?.disponible) {
    return (
      <div className="public-form-page">
        <div className="public-form-card public-form-state">
          <h2>{form?.title || 'Formulario no disponible'}</h2>
          <p>{MOTIVOS[form?.motivo] || 'Este link no es válido.'}</p>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="public-form-page">
        <div className="public-form-card public-form-state">
          <h2>¡Registro guardado!</h2>
          <p>Tu asistencia a "{form.title}" quedó registrada correctamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="public-form-page">
      <div className="public-form-card">
        <h1>{form.title}</h1>
        {form.description && <p className="public-form-description">{form.description}</p>}
        <div className="form-meta">
          {form.event_date && <span>📅 {new Date(form.event_date).toLocaleString('es-CO')}</span>}
          {form.location && <span>📍 {form.location}</span>}
          {form.max_capacity && <span>Cupo: {form.inscritos} / {form.max_capacity}</span>}
        </div>

        <form className="public-form-body" onSubmit={handleSubmit}>
          {error && <div className="public-form-error">{error}</div>}
          {form.questions.map(q => (
            <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => handleChange(q.id, v)} />
          ))}
          <button className="btn-primary" type="submit" disabled={sending}>
            {sending ? 'Enviando...' : 'Registrar asistencia'}
          </button>
        </form>
      </div>
    </div>
  )
}
