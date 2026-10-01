// Renderiza el input correspondiente a una pregunta del formulario público,
// según su tipo. Se usa tanto en la vista previa (deshabilitada) como en la
// vista pública real.
export default function QuestionField({ question, value, onChange, disabled }) {
  const common = { disabled, required: question.required }

  const renderInput = () => {
    switch (question.type) {
      case 'texto_largo':
        return <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
      case 'numero':
        return <input type="number" value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
      case 'correo':
        return <input type="email" value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
      case 'telefono':
        return <input type="tel" value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
      case 'fecha':
        return <input type="date" value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
      case 'lista_desplegable':
        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} {...common}>
            <option value="">Seleccionar...</option>
            {(question.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )
      case 'seleccion_unica':
        return (
          <div className="public-form-choice-group">
            {(question.options || []).map(opt => (
              <label key={opt}>
                <input type="radio" name={`q_${question.id}`} value={opt} checked={value === opt}
                  onChange={() => onChange(opt)} disabled={disabled} />
                {opt}
              </label>
            ))}
          </div>
        )
      case 'seleccion_multiple': {
        const selected = Array.isArray(value) ? value : []
        return (
          <div className="public-form-choice-group">
            {(question.options || []).map(opt => (
              <label key={opt}>
                <input type="checkbox" checked={selected.includes(opt)} disabled={disabled}
                  onChange={e => onChange(e.target.checked ? [...selected, opt] : selected.filter(o => o !== opt))} />
                {opt}
              </label>
            ))}
          </div>
        )
      }
      case 'aceptacion':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={value === true} disabled={disabled}
              onChange={e => onChange(e.target.checked)} />
            {question.help_text || 'Acepto'}
          </label>
        )
      default:
        return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} {...common} />
    }
  }

  if (question.type === 'aceptacion') {
    return <div className="modal-field">{renderInput()}</div>
  }

  return (
    <div className="modal-field">
      <label>{question.label}{question.required ? ' *' : ''}</label>
      {renderInput()}
      {question.help_text && <span className="public-form-help">{question.help_text}</span>}
    </div>
  )
}
