import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Users, QrCode, PlayCircle, PauseCircle, RotateCcw, FilesIcon, Trash2, ClipboardList, LayoutList, UserRound, Share2 } from 'lucide-react'
import { fetchForms } from '../../../services/attendance_forms/fetchForms'
import { publishForm } from '../../../services/attendance_forms/publishForm'
import { closeForm } from '../../../services/attendance_forms/closeForm'
import { reopenForm } from '../../../services/attendance_forms/reopenForm'
import { duplicateForm } from '../../../services/attendance_forms/duplicateForm'
import { deleteForm } from '../../../services/attendance_forms/deleteForm'
import ShareModal from './ShareModal'
import { confirmEliminar, toastExito } from '../../../services/alerts'
import Paginacion from '../../../components/Paginacion'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Formularios/Formularios.css'
import '../../../styles/main/Informes/Informes.css'

const ESTADOS = { borrador: 'Borrador', publicado: 'Publicado', cerrado: 'Cerrado' }
const BADGE_BY_ESTADO = { borrador: 'badge-pending', publicado: 'badge-synced', cerrado: 'badge-error' }

export default function FormulariosList() {
  const navigate = useNavigate()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [vista, setVista] = useState('todos') // todos | mios | compartidos
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
    if (vista === 'mios') rows = rows.filter(f => f.is_owner)
    if (vista === 'compartidos') rows = rows.filter(f => !f.is_owner)
    if (estado) rows = rows.filter(f => f.status === estado)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(f => f.title?.toLowerCase().includes(q))
    }
    return rows
  }, [forms, search, estado, vista])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageActual = Math.min(page, totalPages)
  const paginated = filtered.slice((pageActual - 1) * perPage, pageActual * perPage)

  const runAction = async (form, action) => {
    setBusyId(form.id)
    let ok = true
    try {
      await action()
      await loadData()
    } catch (e) {
      setError(e.message)
      ok = false
    }
    setBusyId(null)
    return ok
  }

  const handleDelete = async (form) => {
    const ok = await confirmEliminar({
      text: `Se eliminará el formulario "${form.title}". Esta acción no se puede deshacer desde la interfaz.`,
    })
    if (!ok) return
    if (await runAction(form, () => deleteForm(form.id))) toastExito('Formulario eliminado')
  }

  return (
    // Mismo lenguaje visual que Onix-IA (clases onix-* de Informes.css): lista sin tabla, acciones claras
    <div className="sync-page onix-root">
      <div className="sync-page-header">
        <div>
          <h2>Acudex</h2>
          <p className="onix-sub">Formularios para registrar la asistencia a eventos, con enlace y código QR para compartir.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/formularios/nuevo')}>
          <Plus size={15} /> Crear Formulario
        </button>
      </div>

      {error && <div className="sync-error">{error}</div>}

      {/* Misma barra que Nexo/Administrador (section-nav de Layout.css), aquí filtra en vez de navegar */}
      <nav className="section-nav" aria-label="Qué formularios ver">
        {[
          { id: 'todos', label: 'Todos', Icon: LayoutList, n: forms.length },
          { id: 'mios', label: 'Mis formularios', Icon: UserRound, n: forms.filter(f => f.is_owner).length },
          { id: 'compartidos', label: 'Compartidos conmigo', Icon: Share2, n: forms.filter(f => !f.is_owner).length },
        ].map(({ id, label, Icon, n }) => (
          <button key={id} type="button" aria-pressed={vista === id}
            className={`section-nav-tab${vista === id ? ' active' : ''}`} onClick={() => { setVista(id); setPage(1) }}>
            <Icon size={15} aria-hidden="true" /> {label} <span className="onix-lista-total">{n}</span>
          </button>
        ))}
      </nav>

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
        <section className="onix-mes onix-seccion" aria-labelledby="formularios-titulo">
          <h4 id="formularios-titulo" className="onix-oculto">Formularios</h4>
          {paginated.length === 0 ? (
            <p className="onix-vacio-texto">No hay formularios que coincidan con el filtro.</p>
          ) : (
            <ol className="onix-actividades">
              {paginated.map(form => {
                const ocupado = busyId === form.id
                const fechaEvento = form.event_date ? new Date(form.event_date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha de evento'
                return (
                  <li key={form.id} className="onix-actividad-fila onix-actividad-config form-fila">
                    <button type="button" className="codex-pagina-abrir"
                      onClick={() => navigate(form.is_owner ? `/formularios/${form.id}/editar` : `/formularios/${form.id}/inscritos`)}>
                      <span className="onix-act-num" aria-hidden="true"><ClipboardList size={18} /></span>
                      <span className="onix-actividad-info">
                        <span className="onix-actividad-nombre">{form.title}</span>
                        <span className="onix-actividad-desc">
                          {fechaEvento}, {form.inscritos}{form.max_capacity ? ` de ${form.max_capacity}` : ''} inscritos, {form.is_owner ? 'creado por ti' : `de ${form.owner_name || form.owner_email || '-'}`}
                        </span>
                      </span>
                    </button>
                    <span className={`badge ${BADGE_BY_ESTADO[form.status]}`}>{ESTADOS[form.status]}</span>
                    <span className="onix-fila-acciones">
                      <button type="button" className="onix-texto-btn" disabled={ocupado} onClick={() => navigate(`/formularios/${form.id}/inscritos`)}><Users size={15} /> Inscritos</button>
                      {form.is_owner && (
                        <button type="button" className="onix-texto-btn" disabled={ocupado} onClick={() => setShareForm(form)}><QrCode size={15} /> Compartir</button>
                      )}
                      {form.is_owner && form.status !== 'publicado' && (
                        <button type="button" className="onix-texto-btn" disabled={ocupado} onClick={() => runAction(form, () => publishForm(form.id))}><PlayCircle size={15} /> Publicar</button>
                      )}
                      {form.is_owner && form.status === 'publicado' && (
                        <button type="button" className="onix-texto-btn" disabled={ocupado} onClick={() => runAction(form, () => closeForm(form.id))}><PauseCircle size={15} /> Cerrar</button>
                      )}
                      {form.is_owner && form.status === 'cerrado' && (
                        <button type="button" className="onix-texto-btn" disabled={ocupado} onClick={() => runAction(form, () => reopenForm(form.id))}><RotateCcw size={15} /> Reabrir</button>
                      )}
                      {form.is_owner && (
                        <>
                          <button type="button" className="btn-icon" title="Editar" aria-label={`Editar ${form.title}`} disabled={ocupado} onClick={() => navigate(`/formularios/${form.id}/editar`)}><Pencil size={14} /></button>
                          <button type="button" className="btn-icon" title="Duplicar" aria-label={`Duplicar ${form.title}`} disabled={ocupado} onClick={() => runAction(form, () => duplicateForm(form.id))}><FilesIcon size={14} /></button>
                          <button type="button" className="btn-icon btn-icon-delete" title="Eliminar" aria-label={`Eliminar ${form.title}`} disabled={ocupado} onClick={() => handleDelete(form)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}

      <Paginacion page={pageActual} totalPages={totalPages} total={filtered.length} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />

      {shareForm && <ShareModal form={shareForm} onClose={() => setShareForm(null)} />}
    </div>
  )
}
