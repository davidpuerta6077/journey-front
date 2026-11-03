import { useState, useEffect, useCallback, useMemo } from 'react'
import { Atom as AtomIcon, Plus, Search, Pencil, CheckCircle2, XCircle, ListTodo, Send, Inbox, CalendarClock, AlarmClock } from 'lucide-react'
import { usePermissions } from '../../services/PermissionsContext'
import { fetchMyTasks } from '../../services/atom/fetchMyTasks'
import { bulkUpdateEstado } from '../../services/atom/bulkUpdateEstado'
import { confirmAccion, alertError, toastExito } from '../../services/alerts'
import Paginacion from '../Paginacion'
import AtomTaskModal from './AtomTaskModal'
import { ESTADOS, PRIORIDADES, slug } from './atomConstants'
import '../../styles/main/Atom/Atom.css'

const VISTAS = (misId) => [
  { key: 'mias', label: 'Mis tareas', Icon: ListTodo, filtros: {} },
  { key: 'asignadas_por_mi', label: 'Asignadas por mí', Icon: Send, filtros: { creado_por: misId } },
  { key: 'asignadas_a_mi', label: 'Asignadas a mí', Icon: Inbox, filtros: { asignado_a: misId } },
  { key: 'hoy', label: 'Tareas de hoy', Icon: CalendarClock, filtros: { hoy: true } },
  { key: 'vencidas', label: 'Vencidas', Icon: AlarmClock, filtros: { vencidas: true } },
  { key: 'completadas', label: 'Completadas', Icon: CheckCircle2, filtros: { estado: 'Completada' } },
]

const FILTROS_VACIOS = { estado: '', prioridad: '', q: '', desde: '', hasta: '' }

function formatFecha(v) {
  if (!v) return '-'
  const f = new Date(v)
  return Number.isNaN(f.getTime()) ? '-' : f.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function estaVencida(task) {
  if (!task.due_date || ['Completada', 'Cancelada'].includes(task.status)) return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

export default function AtomWidget() {
  const { permissions, profile } = usePermissions()
  const tiene = (code) => permissions?.modules?.some((m) => m.submodules.some((s) => s.submodule_code === code))
  const puedeUsar = tiene('atom_use')
  const puedeAsignar = tiene('atom_assign')

  const [tasks, setTasks] = useState([])
  const [counts, setCounts] = useState({ pendientes: 0, vencidas: 0, completadas: 0 })
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('mias')
  const [extraFiltros, setExtraFiltros] = useState({})
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [modalData, setModalData] = useState(null) // { id } edición/detalle, { nuevo: true } creación, null cerrado

  const vistas = useMemo(() => VISTAS(profile?.id), [profile?.id])

  const cargar = useCallback(() => {
    if (!puedeUsar) return
    setLoading(true)
    const params = { ...extraFiltros, ...filtros }
    fetchMyTasks(params)
      .then((r) => { setTasks(r.tasks || []); setCounts(r.counts || { pendientes: 0, vencidas: 0, completadas: 0 }) })
      .catch((e) => console.error('Error cargando tareas de Atom:', e.message))
      .finally(() => setLoading(false))
  }, [puedeUsar, extraFiltros, filtros])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setPage(1) }, [extraFiltros, filtros])

  // Deep-link desde una notificación: /?atom_task=123 (nunca una página aparte).
  useEffect(() => {
    if (!puedeUsar) return
    const q = new URLSearchParams(window.location.search)
    const taskId = q.get('atom_task')
    if (!taskId) return
    window.history.replaceState(null, '', window.location.pathname)
    setModalData({ id: Number(taskId) })
  }, [puedeUsar])

  if (!puedeUsar) return null

  const cambiarVista = (v) => {
    setVistaActiva(v.key)
    setExtraFiltros(v.filtros)
    setSelectedIds(new Set())
  }

  const handleFiltroChange = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }))

  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const toggleSelectAll = () => setSelectedIds((prev) => (
    prev.size === paginadas.length ? new Set() : new Set(paginadas.map((t) => t.id))
  ))

  const handleBulk = async (estado) => {
    const ok = await confirmAccion({
      title: estado === 'Cancelada' ? '¿Cancelar las tareas seleccionadas?' : '¿Marcar como completadas?',
      text: `Se actualizarán ${selectedIds.size} tarea(s).`,
    })
    if (!ok) return
    try {
      await bulkUpdateEstado([...selectedIds], estado)
      setSelectedIds(new Set())
      toastExito('Tareas actualizadas')
      cargar()
    } catch (e) {
      alertError(e.message)
    }
  }

  const total = tasks.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const paginadas = tasks.slice((page - 1) * perPage, page * perPage)

  return (
    <section className="hub-atom estilo-hub">
      <div className="atom-card">
        <div className="atom-header">
          <div className="atom-header-info">
            <span className="atom-header-icon"><AtomIcon size={20} /></span>
            <div className="atom-header-title">
              <h2>Atom</h2>
              <p>Organiza tus tareas, haz que pasen</p>
            </div>
          </div>
          <div className="atom-header-actions">
            <div className="atom-counts">
              <div className="atom-count-chip"><strong>{counts.pendientes}</strong><span>Pendientes</span></div>
              <div className="atom-count-chip atom-count-vencidas"><strong>{counts.vencidas}</strong><span>Vencidas</span></div>
              <div className="atom-count-chip atom-count-completadas"><strong>{counts.completadas}</strong><span>Completadas</span></div>
            </div>
            <button className="btn-primary" onClick={() => setModalData({ nuevo: true })}>
              <Plus size={15} /> Nueva tarea
            </button>
          </div>
        </div>

        <div className="atom-quickviews">
          {vistas.map((v) => (
            <button
              key={v.key}
              type="button"
              className={`atom-quickview-btn ${vistaActiva === v.key ? 'active' : ''}`}
              onClick={() => cambiarVista(v)}
            >
              <v.Icon size={15} aria-hidden="true" /> {v.label}
            </button>
          ))}
        </div>

        <div className="atom-filters">
          <div className="filter-input-wrapper">
            <Search size={14} className="filter-icon" />
            <input className="filter-input" name="q" placeholder="Buscar por título..." value={filtros.q} onChange={handleFiltroChange} />
          </div>
          <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select name="prioridad" value={filtros.prioridad} onChange={handleFiltroChange}>
            <option value="">Toda prioridad</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" name="desde" value={filtros.desde} onChange={handleFiltroChange} title="Desde" />
          <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltroChange} title="Hasta" />
          {(filtros.estado || filtros.prioridad || filtros.q || filtros.desde || filtros.hasta) && (
            <button className="btn-secondary" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="atom-bulkbar">
            <span>{selectedIds.size} seleccionada(s)</span>
            <button className="btn-secondary" onClick={() => handleBulk('Completada')}><CheckCircle2 size={14} /> Marcar completadas</button>
            <button className="btn-secondary" onClick={() => handleBulk('Cancelada')}><XCircle size={14} /> Cancelar</button>
            <button className="btn-secondary" onClick={() => setSelectedIds(new Set())}>Quitar selección</button>
          </div>
        )}

        {loading ? (
          <div className="loading-box"><span className="loader"></span>Cargando tareas...</div>
        ) : paginadas.length === 0 ? (
          <p className="atom-empty">No hay tareas para este filtro.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === paginadas.length} onChange={toggleSelectAll} /></th>
                  <th>Tarea</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Vencimiento</th>
                  <th>Creado por</th>
                  <th>Asignado a</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((t) => (
                  <tr key={t.id}>
                    <td data-label="">
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td data-label="Tarea" onClick={() => setModalData({ id: t.id })} style={{ cursor: 'pointer' }}>{t.title}</td>
                    <td data-label="Prioridad"><span className={`atom-badge atom-prioridad-${slug(t.priority)}`}>{t.priority}</span></td>
                    <td data-label="Estado"><span className={`atom-badge atom-estado-${slug(t.status)}`}>{t.status}</span></td>
                    <td data-label="Vencimiento" className={estaVencida(t) ? 'atom-vencida' : ''}>{formatFecha(t.due_date)}</td>
                    <td data-label="Creado por">{t.created_by_nombre}</td>
                    <td data-label="Asignado a">{t.assigned_to_nombre || '-'}</td>
                    <td data-label="Acciones">
                      <div className="action-btns">
                        <button className="btn-icon btn-icon-edit" title="Ver / editar" onClick={() => setModalData({ id: t.id })}><Pencil size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion page={page} totalPages={totalPages} total={total} perPage={perPage} onPage={setPage} onPerPage={setPerPage} />
      </div>

      {modalData && (
        <AtomTaskModal
          id={modalData.id}
          nuevo={!!modalData.nuevo}
          puedeAsignar={puedeAsignar}
          onClose={() => setModalData(null)}
          onSaved={() => { setModalData(null); cargar() }}
        />
      )}
    </section>
  )
}
