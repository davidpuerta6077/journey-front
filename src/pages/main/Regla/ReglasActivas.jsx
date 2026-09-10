import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Power, Plus } from 'lucide-react'
import { fetchReglas } from '../../../services/admin/fetchReglas'
import { createRegla } from '../../../services/admin/createRegla'
import { updateRegla } from '../../../services/admin/updateRegla'
import { deleteRegla } from '../../../services/admin/deleteRegla'
import { fetchMoodleCategorias } from '../../../services/admin/fetchMoodleCategorias'
import { fetchMoodleSemillas } from '../../../services/admin/fetchMoodleSemillas'
import { createMoodleCategoria } from '../../../services/admin/createMoodleCategoria'
import { fetchAsignaturas } from '../../../services/admin/fetchAsignaturas'
import "../../../styles/main/Sync/SyncUsuariosP.css"

const EMPTY_FORM = { codigo_asignatura: '', programa: '', departamento: '', seed_shortname: '', categoryid: '', activo: true }

function ReglaModal({ title, initial, categorias, semillas, asignaturas, onCategoriaCreada, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleCrearCategoria = async () => {
    if (!nuevaCategoriaNombre.trim()) return
    setError('')
    try {
      const nueva = await onCategoriaCreada(nuevaCategoriaNombre.trim())
      setForm(f => ({ ...f, categoryid: String(nueva.id) }))
      setNuevaCategoriaNombre('')
      setCreandoCategoria(false)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!form.seed_shortname || !form.categoryid) {
      setError('Semilla y categoría destino son obligatorias.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        codigo_asignatura: form.codigo_asignatura || null,
        programa: form.programa || null,
        departamento: form.departamento || null,
        seed_shortname: form.seed_shortname,
        categoryid: Number(form.categoryid),
        activo: !!form.activo
      })
      onClose()
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <p className="modal-hint">
            Deja la asignatura vacía para que la regla aplique de forma más general
            (opcionalmente puedes limitarla más por programa/departamento en "Opciones avanzadas").
            La más específica que coincida gana.
          </p>
          <div className="modal-field">
            <label>Asignatura</label>
            <input
              name="codigo_asignatura"
              list="asignaturas-datalist"
              value={form.codigo_asignatura}
              onChange={handleChange}
              placeholder="Busca por nombre o código (vacío = cualquiera)"
              autoComplete="off"
            />
            <datalist id="asignaturas-datalist">
              {asignaturas.map(a => (
                <option key={a.codigo_asignatura} value={a.codigo_asignatura}>
                  {a.nombre_asignatura ? `${a.nombre_asignatura} (${a.codigo_asignatura})` : a.codigo_asignatura}
                </option>
              ))}
            </datalist>
          </div>
          <div className="modal-field">
            <label>Semilla en Moodle *</label>
            <select name="seed_shortname" value={form.seed_shortname} onChange={handleChange}>
              <option value="">Selecciona un curso semilla...</option>
              {semillas.map(s => (
                <option key={s.id} value={s.shortname}>{s.fullname} ({s.shortname})</option>
              ))}
              {form.seed_shortname && !semillas.some(s => s.shortname === form.seed_shortname) && (
                <option value={form.seed_shortname}>{form.seed_shortname} (actual, no está en la lista)</option>
              )}
            </select>
          </div>
          <div className="modal-field">
            <label>Categoría Moodle destino *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select name="categoryid" value={form.categoryid} onChange={handleChange} style={{ flex: 1 }}>
                <option value="">Selecciona una categoría...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (id {c.id})</option>
                ))}
                {form.categoryid && !categorias.some(c => String(c.id) === String(form.categoryid)) && (
                  <option value={form.categoryid}>categoryid {form.categoryid} (actual, no está en la lista)</option>
                )}
              </select>
              <button type="button" className="btn-icon" title="Crear categoría nueva en Moodle" onClick={() => setCreandoCategoria(v => !v)}>
                <Plus size={16} />
              </button>
            </div>
            {creandoCategoria && (
              <div className="modal-row" style={{ marginTop: 8 }}>
                <input
                  placeholder="Nombre de la nueva categoría"
                  value={nuevaCategoriaNombre}
                  onChange={e => setNuevaCategoriaNombre(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-secondary" onClick={handleCrearCategoria}>Crear</button>
              </div>
            )}
          </div>
          <details className="modal-field">
            <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
              Opciones avanzadas (programa / departamento)
            </summary>
            <div className="modal-row" style={{ marginTop: 8 }}>
              <div className="modal-field">
                <label>Programa</label>
                <input name="programa" value={form.programa} onChange={handleChange} placeholder="ej. Tecnología en desarrollo de software" />
              </div>
              <div className="modal-field">
                <label>Departamento</label>
                <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="ej. Sistemas Digitales" />
              </div>
            </div>
          </details>
          <div className="modal-field">
            <label>
              <input type="checkbox" checked={!!form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ marginRight: 6 }} />
              Regla activa
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReglasActivas() {
  const [reglas, setReglas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editRegla, setEditRegla]   = useState(null)

  const [categorias, setCategorias]   = useState([])
  const [semillas, setSemillas]       = useState([])
  const [asignaturas, setAsignaturas] = useState([])

  const loadReglas = useCallback(async () => {
    setLoading(true)
    try {
      setReglas(await fetchReglas())
    } catch (e) {
      console.error('Error cargando reglas:', e.message)
    }
    setLoading(false)
  }, [])

  const loadCatalogos = useCallback(async () => {
    try {
      const [cats, seeds, asigs] = await Promise.all([
        fetchMoodleCategorias(), fetchMoodleSemillas(), fetchAsignaturas()
      ])
      setCategorias(cats)
      setSemillas(seeds)
      setAsignaturas(asigs)
    } catch (e) {
      console.error('Error cargando catálogos para el formulario de reglas:', e.message)
    }
  }, [])

  useEffect(() => { loadReglas(); loadCatalogos() }, [loadReglas, loadCatalogos])

  const handleCategoriaCreada = async (nombre) => {
    const nueva = await createMoodleCategoria({ name: nombre })
    setCategorias(prev => [...prev, nueva])
    return nueva
  }

  const handleToggleActivo = async (regla) => {
    try {
      await updateRegla(regla.id, {
        codigo_asignatura: regla.codigo_asignatura,
        programa: regla.programa,
        departamento: regla.departamento,
        seed_shortname: regla.seed_shortname,
        categoryid: regla.categoryid,
        activo: !regla.activo
      })
      await loadReglas()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleDelete = async (regla) => {
    if (!confirm(`¿Eliminar la regla "${regla.seed_shortname}" (id ${regla.id})?`)) return
    try {
      await deleteRegla(regla.id)
      await loadReglas()
    } catch (e) {
      console.error('Error eliminando regla:', e.message)
    }
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Reglas de Sincronización</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>Crear Regla</button>
      </div>
      <p className="permisos-intro">
        Define, por código de asignatura, programa y/o departamento, qué curso semilla de Moodle y
        qué categoría destino usa <code>sync-courses</code> al crear un curso nuevo. La regla más
        específica que coincida es la que se aplica.
      </p>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando reglas...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código Asignatura</th>
                <th>Programa</th>
                <th>Departamento</th>
                <th>Semilla</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reglas.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No hay reglas creadas todavía.</td></tr>
              )}
              {reglas.map(r => (
                <tr key={r.id}>
                  <td>{r.codigo_asignatura || <em style={{ opacity: 0.5 }}>cualquiera</em>}</td>
                  <td>{r.programa || <em style={{ opacity: 0.5 }}>cualquiera</em>}</td>
                  <td>{r.departamento || <em style={{ opacity: 0.5 }}>cualquiera</em>}</td>
                  <td><code>{r.seed_shortname}</code></td>
                  <td>{r.categoryid}</td>
                  <td>
                    <span className={`badge ${r.activo ? 'badge-synced' : 'badge-pending'}`}>
                      {r.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon btn-icon-edit" onClick={() => setEditRegla(r)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon" onClick={() => handleToggleActivo(r)} title={r.activo ? 'Desactivar' : 'Activar'}>
                        <Power size={14} />
                      </button>
                      <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(r)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <ReglaModal
          title="Crear Regla"
          initial={EMPTY_FORM}
          categorias={categorias}
          semillas={semillas}
          asignaturas={asignaturas}
          onCategoriaCreada={handleCategoriaCreada}
          onClose={() => setShowCreate(false)}
          onSave={(form) => createRegla(form).then(loadReglas)}
        />
      )}
      {editRegla && (
        <ReglaModal
          title="Editar Regla"
          categorias={categorias}
          semillas={semillas}
          asignaturas={asignaturas}
          onCategoriaCreada={handleCategoriaCreada}
          initial={{
            codigo_asignatura: editRegla.codigo_asignatura || '',
            programa: editRegla.programa || '',
            departamento: editRegla.departamento || '',
            seed_shortname: editRegla.seed_shortname || '',
            categoryid: editRegla.categoryid || '',
            activo: editRegla.activo
          }}
          onClose={() => setEditRegla(null)}
          onSave={(form) => updateRegla(editRegla.id, form).then(loadReglas)}
        />
      )}
    </div>
  )
}
