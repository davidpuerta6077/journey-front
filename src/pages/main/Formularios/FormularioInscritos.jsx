import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, Trash2 } from 'lucide-react'
import { fetchFormDetail } from '../../../services/attendance_forms/fetchFormDetail'
import { fetchFormResponses } from '../../../services/attendance_forms/fetchFormResponses'
import { deleteFormResponse } from '../../../services/attendance_forms/deleteFormResponse'
import { exportFormResponses } from '../../../services/attendance_forms/exportFormResponses'
import { exportFormResponsesPdf } from '../../../services/attendance_forms/exportFormResponsesPdf'
import Paginacion from '../../../components/Paginacion'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Formularios/Formularios.css'

export default function FormularioInscritos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [detail, data] = await Promise.all([fetchFormDetail(id), fetchFormResponses(id)])
      setForm(detail)
      setQuestions(data.questions)
      setResponses(data.responses)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    if (!search) return responses
    const q = search.toLowerCase()
    return responses.filter(r => Object.values(r.answers).some(v => String(v).toLowerCase().includes(q)))
  }, [responses, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageActual = Math.min(page, totalPages)
  const paginated = filtered.slice((pageActual - 1) * perPage, pageActual * perPage)

  const handleDelete = async (response) => {
    if (!confirm('¿Eliminar este registro de inscripción?')) return
    try {
      await deleteFormResponse(id, response.id)
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportFormResponses(id)
    } catch (e) {
      setError(e.message)
    }
    setExporting(false)
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      await exportFormResponsesPdf(id)
    } catch (e) {
      setError(e.message)
    }
    setExportingPdf(false)
  }

  const formatValue = (q, value) => {
    if (value == null) return '-'
    if (q.type === 'seleccion_multiple') {
      try { return JSON.parse(value).join(', ') } catch { return value }
    }
    if (q.type === 'aceptacion') return value === 'true' || value === true ? 'Sí' : 'No'
    return value
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>
          <button className="btn-icon" onClick={() => navigate('/formularios')} style={{ marginRight: 10 }}><ArrowLeft size={14} /></button>
          Inscritos — {form?.title || '...'}
        </h2>
        <div className="action-btns">
          <button className="btn-secondary" onClick={handleExportPdf} disabled={exportingPdf || responses.length === 0}>
            <Download size={15} /> {exportingPdf ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={exporting || responses.length === 0}>
            <Download size={15} /> {exporting ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {error && <div className="sync-error">{error}</div>}

      {!loading && (
        <div className="form-meta" style={{ marginBottom: 14 }}>
          <span>Total inscritos: {responses.length}</span>
          {form?.max_capacity != null && <span>Cupo restante: {Math.max(0, form.max_capacity - responses.length)} / {form.max_capacity}</span>}
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" placeholder="Buscar en las respuestas..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando inscritos...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {questions.map(q => <th key={q.id}>{q.label}</th>)}
                <th>Fecha de registro</th>
                {form?.is_owner && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id}>
                  {questions.map(q => <td key={q.id} data-label={q.label}>{formatValue(q, r.answers[q.label])}</td>)}
                  <td data-label="Fecha de registro">{new Date(r.submitted_at).toLocaleString('es-CO')}</td>
                  {form?.is_owner && (
                    <td data-label="Acciones">
                      <button className="btn-icon btn-icon-delete" title="Eliminar" onClick={() => handleDelete(r)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={questions.length + (form?.is_owner ? 2 : 1)} style={{ textAlign: 'center', color: '#94a3b8' }}>Aún no hay inscritos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion page={pageActual} totalPages={totalPages} total={filtered.length} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
    </div>
  )
}
