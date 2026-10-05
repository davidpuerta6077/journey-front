import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Users, QrCode, PlayCircle, PauseCircle, RotateCcw, FilesIcon, Trash2 } from 'lucide-react'
import { fetchForms } from '../../../services/attendance_forms/fetchForms'
import { publishForm } from '../../../services/attendance_forms/publishForm'
import { closeForm } from '../../../services/attendance_forms/closeForm'
import { reopenForm } from '../../../services/attendance_forms/reopenForm'
import { duplicateForm } from '../../../services/attendance_forms/duplicateForm'
import { deleteForm } from '../../../services/attendance_forms/deleteForm'
import ShareModal from './ShareModal'
import Paginacion from '../../../components/Paginacion'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Formularios/Formularios.css'

const ESTADOS = { borrador: 'Borrador', publicado: 'Publicado', cerrado: 'Cerrado' }
const BADGE_BY_ESTADO = { borrador: 'badge-pending', publicado: 'badge-synced', cerrado: 'badge-error' }

export default function FormulariosList() {
  const navigate = useNavigate()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [shareForm, setShareForm] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setForms(await fetchForms())
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    let rows = forms
    if (estado) rows = rows.filter(f => f.status === estado)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(f => f.title?.toLowerCase().includes(q))
    }
    return rows
  }, [forms, search, estado])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageActual = Math.min(page, totalPages)
  const paginated = filtered.slice((pageActual - 1) * perPage, pageActual * perPage)

  const runAction = async (form, action) => {
    setBusyId(form.id)
    try {
      await action()
      await loadData()
    } catch (e) {
      setError(e.message)
    }
    setBusyId(null)
  }

  const handleDelete = (form) => {
    if (!confirm(`¿Eliminar el formulario "${form.title}"? Esta acción no se puede deshacer desde la interfaz.`)) return
    runAction(form, () => deleteForm(form.id))
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Formularios de Asistencia</h2>
        <button className="btn-primary" onClick={() => navigate('/formularios/nuevo')}>
          <Plus size={15} /> Crear Formulario
        </button>
      </div>

      {error && <div className="sync-error">{error}</div>}

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por título..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={estado} onChange={e => { setEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando formularios...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Dueño</th>
                <th>Fecha del evento</th>
                <th>Estado</th>
                <th>Inscritos</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(form => (
                <tr key={form.id}>
                  <td data-label="Título">{form.title}</td>
                  <td data-label="Dueño">{form.is_owner ? 'Tú' : (form.owner_name || form.owner_email || '-')}</td>
                  <td data-label="Fecha del evento">{form.event_date ? new Date(form.event_date).toLocaleString('es-CO') : '-'}</td>
                  <td data-label="Estado"><span className={`badge ${BADGE_BY_ESTADO[form.status]}`}>{ESTADOS[form.status]}</span></td>
                  <td data-label="Inscritos">{form.inscritos}{form.max_capacity ? ` / ${form.max_capacity}` : ''}</td>
                  <td data-label="Creado">{new Date(form.created_at).toLocaleDateString('es-CO')}</td>
                  <td data-label="Acciones">
                    <div className="action-btns">
                      {form.is_owner && (
                        <button className="btn-icon btn-icon-edit" title="Editar" disabled={busyId === form.id}
                          onClick={() => navigate(`/formularios/${form.id}/editar`)}>
                          <Pencil size={14} />
                        </button>
                      )}
                      <button className="btn-icon" title="Ver inscritos" disabled={busyId === form.id}
                        onClick={() => navigate(`/formularios/${form.id}/inscritos`)}>
                        <Users size={14} />
                      </button>
                      {form.is_owner && (
                        <button className="btn-icon" title="Compartir" disabled={busyId === form.id}
                          onClick={() => setShareForm(form)}>
                          <QrCode size={14} />
                        </button>
                      )}
                      {form.is_owner && form.status !== 'publicado' && (
                        <button className="btn-icon" title="Publicar" disabled={busyId === form.id}
                          onClick={() => runAction(form, () => publishForm(form.id))}>
                          <PlayCircle size={14} />
                        </button>
                      )}
                      {form.is_owner && form.status === 'publicado' && (
                        <button className="btn-icon" title="Cerrar" disabled={busyId === form.id}
                          onClick={() => runAction(form, () => closeForm(form.id))}>
                          <PauseCircle size={14} />
                        </button>
                      )}
                      {form.is_owner && form.status === 'cerrado' && (
                        <button className="btn-icon" title="Reabrir" disabled={busyId === form.id}
                          onClick={() => runAction(form, () => reopenForm(form.id))}>
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {form.is_owner && (
                        <button className="btn-icon" title="Duplicar" disabled={busyId === form.id}
                          onClick={() => runAction(form, () => duplicateForm(form.id))}>
                          <FilesIcon size={14} />
                        </button>
                      )}
                      {form.is_owner && (
                        <button className="btn-icon btn-icon-delete" title="Eliminar" disabled={busyId === form.id}
                          onClick={() => handleDelete(form)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No hay formularios que coincidan con el filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion page={pageActual} totalPages={totalPages} total={filtered.length} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />

      {shareForm && <ShareModal form={shareForm} onClose={() => setShareForm(null)} />}
    </div>
  )
}
