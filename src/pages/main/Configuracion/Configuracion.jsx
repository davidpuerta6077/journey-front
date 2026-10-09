import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { fetchSettings } from '../../../services/settings/fetchSettings'
import { saveSetting } from '../../../services/settings/saveSetting'
import { uploadLogo } from '../../../services/settings/uploadLogo'
import { uploadFavicon } from '../../../services/settings/uploadFavicon'
import { finalizePeriodo } from '../../../services/settings/finalizePeriodo'
import config from '../../../config'
import { fetchMenuLinks } from '../../../services/settings/fetchMenuLinks'
import { createMenuLink } from '../../../services/settings/createMenuLink'
import { updateMenuLink } from '../../../services/settings/updateMenuLink'
import { deleteMenuLink } from '../../../services/settings/deleteMenuLink'
import { applyAppearance } from '../../../services/settings/applyAppearance'
import { clearCache } from '../../../services/swrCache'
import { confirmEliminar, confirmAccion, alertError, toastExito } from '../../../services/alerts'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Sync/SyncMatriculas.css'

const asMap = (settings) => Object.fromEntries((settings || []).map(s => [s.clave, s.valor]))

// ─── APARIENCIA ─────────────────────────────────────────────────────────────

function TabApariencia() {
  const [form, setForm] = useState({ logo_texto: '', logo_url: '', favicon_url: '', color_primario: '', color_secundario: '', color_menu: '', tipografia: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => {
    fetchSettings('apariencia')
      .then(settings => setForm(f => ({ ...f, ...asMap(settings) })))
      .catch(e => console.error('Error cargando apariencia:', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogoFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      await uploadLogo(file)
      const settings = await fetchSettings('apariencia')
      setForm(f => ({ ...f, ...asMap(settings) }))
      toastExito('Logo actualizado')
    } catch (err) {
      alertError(err.message)
    }
    setUploadingLogo(false)
    e.target.value = ''
  }

  const handleFaviconFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFavicon(true)
    try {
      await uploadFavicon(file)
      const settings = await fetchSettings('apariencia')
      setForm(f => ({ ...f, ...asMap(settings) }))
      applyAppearance(settings)
      toastExito('Favicon actualizado')
    } catch (err) {
      alertError(err.message)
    }
    setUploadingFavicon(false)
    e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(form).filter(([clave, v]) => clave !== 'logo_url' && clave !== 'favicon_url' && v !== '')
      await Promise.all(entries.map(([clave, valor]) => saveSetting('apariencia', clave, valor)))
      applyAppearance(entries.map(([clave, valor]) => ({ clave, valor })))
      toastExito('Apariencia guardada')
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="modal-form" style={{ maxWidth: 480 }}>
      <div className="modal-field">
        <label>Logo (imagen) — opcional, reemplaza el de Bravo Hub por defecto</label>
        {form.logo_url && <img src={`${config.api_domain.url_base}${form.logo_url}`} alt="Logo actual" style={{ height: 40, objectFit: 'contain', marginBottom: 8 }} />}
        <input type="file" accept="image/*" onChange={handleLogoFile} disabled={uploadingLogo} />
        {uploadingLogo && <span className="modal-hint">Subiendo...</span>}
      </div>
      <div className="modal-field">
        <label>Favicon (icono de la pestaña del navegador)</label>
        {form.favicon_url && <img src={`${config.api_domain.url_base}${form.favicon_url}`} alt="Favicon actual" style={{ height: 24, width: 24, objectFit: 'contain', marginBottom: 8 }} />}
        <input type="file" accept="image/*" onChange={handleFaviconFile} disabled={uploadingFavicon} />
        {uploadingFavicon && <span className="modal-hint">Subiendo...</span>}
      </div>
      <div className="modal-field">
        <label>Nombre / logo (texto alternativo del logo, accesibilidad)</label>
        <input name="logo_texto" value={form.logo_texto || ''} onChange={handleChange} placeholder="Bravo Hub" />
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label>Color primario</label>
          <input type="color" name="color_primario" value={form.color_primario || '#5b84ff'} onChange={handleChange} />
        </div>
        <div className="modal-field">
          <label>Color secundario</label>
          <input type="color" name="color_secundario" value={form.color_secundario || '#f1f5f9'} onChange={handleChange} />
        </div>
      </div>
      <div className="modal-field">
        <label>Color del menú (sidebar)</label>
        <input type="color" name="color_menu" value={form.color_menu || '#1e3a6e'} onChange={handleChange} />
      </div>
      <div className="modal-field">
        <label>Tipografía (familia de fuente)</label>
        <input name="tipografia" value={form.tipografia || ''} onChange={handleChange} placeholder="Segoe UI" />
      </div>
      <p className="modal-hint">El color primario se aplica a los botones principales. La barra superior (nav) usa el color fijo de la marca Bravo Hub y no es configurable.</p>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  )
}

// ─── HOME ───────────────────────────────────────────────────────────────────

function TabHome() {
  const [frase, setFrase] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings('home')
      .then(settings => setFrase(asMap(settings).frase_bienvenida || ''))
      .catch(e => console.error('Error cargando home:', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSetting('home', 'frase_bienvenida', frase)
      toastExito('Frase guardada')
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="modal-form" style={{ maxWidth: 480 }}>
      <div className="modal-field">
        <label>Frase de bienvenida (Home)</label>
        <textarea rows={3} value={frase} onChange={e => setFrase(e.target.value)} />
      </div>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  )
}

// ─── ACADÉMICO ──────────────────────────────────────────────────────────────

function TabAcademico() {
  const [periodo, setPeriodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  useEffect(() => {
    fetchSettings('academico')
      .then(settings => setPeriodo(asMap(settings).periodo_actual || ''))
      .catch(e => console.error('Error cargando académico:', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSetting('academico', 'periodo_actual', periodo)
      toastExito('Periodo actual guardado')
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  const handleCerrarPeriodo = async () => {
    const ok = await confirmAccion({
      title: '¿Cerrar el periodo completo?',
      text: `Todas las matrículas activas (Matriculado) del periodo "${periodo}" pasarán a Finalizado, en cualquier curso. Moodle las desmatricula sola en el próximo cron (vía BD externa); no se puede deshacer desde aquí.`,
      confirmButtonText: 'Sí, cerrar periodo',
    })
    if (!ok) return
    setCerrando(true)
    try {
      const result = await finalizePeriodo()
      toastExito(`${result.finalizadas} matrícula(s) finalizada(s) en el periodo ${result.periodo}`)
    } catch (e) {
      alertError(e.message)
    }
    setCerrando(false)
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="modal-form" style={{ maxWidth: 480 }}>
      <div className="modal-field">
        <label>Periodo académico actual</label>
        <input value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="2026-1" />
      </div>
      <p className="modal-hint">Referencia global del periodo vigente (ej. "2026-1"), para usarse como default en los filtros de Módulos/Sync de Cursos y Matrículas.</p>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
      <div className="modal-field" style={{ marginTop: 16 }}>
        <label>Cierre de semestre</label>
        <p className="modal-hint" style={{ marginTop: 0 }}>Finaliza de una sola vez todas las matrículas activas del periodo "{periodo}", en todos los cursos. Para cerrar un solo curso, usa el botón de "Cerrar semestre" en Módulo Cursos.</p>
      </div>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-secondary" onClick={handleCerrarPeriodo} disabled={cerrando || !periodo}>{cerrando ? 'Cerrando...' : 'Cerrar periodo'}</button>
      </div>
    </div>
  )
}

// ─── MENÚ (accesos externos) ───────────────────────────────────────────────

const EMPTY_LINK = { nombre: '', url: '', nueva_pestana: true, orden: 0, activo: true }

function MenuLinkModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.nombre || !form.url) { setError('Nombre y URL son obligatorios.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
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
          <h3>{initial.id ? 'Editar acceso' : 'Crear acceso'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-field">
            <label>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Mesa de ayuda" />
          </div>
          <div className="modal-field">
            <label>URL *</label>
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Orden</label>
              <input type="number" value={form.orden} onChange={e => setForm({ ...form, orden: Number(e.target.value) })} />
            </div>
            <div className="modal-field" style={{ justifyContent: 'center' }}>
              <label><input type="checkbox" checked={form.nueva_pestana} onChange={e => setForm({ ...form, nueva_pestana: e.target.checked })} /> Abrir en pestaña nueva</label>
            </div>
          </div>
          {initial.id && (
            <div className="modal-field">
              <label><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} /> Activo (visible en el menú)</label>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

function TabMenu() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState(null)

  const load = useCallback(() => {
    fetchMenuLinks()
      .then(setLinks)
      .catch(e => console.error('Error cargando accesos:', e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (link) => {
    const ok = await confirmEliminar({ text: `Se eliminará el acceso "${link.nombre}" del menú.` })
    if (!ok) return
    try {
      await deleteMenuLink(link.id)
      await load()
      toastExito('Acceso eliminado')
    } catch (e) {
      alertError(e.message)
    }
  }

  const handleSaveModal = async (form) => {
    if (modalData.id) await updateMenuLink(modalData.id, form)
    else await createMenuLink(form)
    await load()
    toastExito(modalData.id ? 'Acceso actualizado' : 'Acceso creado')
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <>
      <div className="sync-page-header" style={{ padding: 0, marginBottom: 16 }}>
        <p className="modal-hint" style={{ margin: 0 }}>Accesos externos que se muestran en el menú lateral, después del acceso a Administrador.</p>
        <button className="btn-primary" onClick={() => setModalData({ ...EMPTY_LINK })}>
          <Plus size={15} /> Crear acceso
        </button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>URL</th>
              <th>Pestaña nueva</th>
              <th>Orden</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No hay accesos creados.</td></tr>
            )}
            {links.map(link => (
              <tr key={link.id}>
                <td data-label="Nombre">{link.nombre}</td>
                <td data-label="URL">{link.url}</td>
                <td data-label="Pestaña nueva">{link.nueva_pestana ? 'Sí' : 'No'}</td>
                <td data-label="Orden">{link.orden}</td>
                <td data-label="Activo"><span className={`badge ${link.activo ? 'badge-synced' : 'badge-pending'}`}>{link.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td data-label="Acciones">
                  <div className="action-btns">
                    <button className="btn-icon btn-icon-edit" onClick={() => setModalData(link)} title="Editar"><Pencil size={14} /></button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(link)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalData && <MenuLinkModal initial={modalData} onClose={() => setModalData(null)} onSave={handleSaveModal} />}
    </>
  )
}

// ─── MOODLE (conexión) ──────────────────────────────────────────────────────

function TabMoodle() {
  const [form, setForm] = useState({ moodle_url: '', moodle_token: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings('moodle')
      .then(settings => setForm(f => ({ ...f, ...asMap(settings) })))
      .catch(e => console.error('Error cargando moodle:', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(form).filter(([, v]) => v !== '')
      await Promise.all(entries.map(([clave, valor]) => saveSetting('moodle', clave, valor)))
      toastExito('Conexión a Moodle guardada')
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="modal-form" style={{ maxWidth: 480 }}>
      <div className="modal-field">
        <label>URL del webservice de Moodle</label>
        <input name="moodle_url" value={form.moodle_url || ''} onChange={handleChange} placeholder="https://.../webservice/rest/server.php" />
      </div>
      <div className="modal-field">
        <label>Token</label>
        <input name="moodle_token" value={form.moodle_token || ''} onChange={handleChange} placeholder="Token del webservice" />
      </div>
      <p className="modal-hint">Si se deja vacío, se usa el valor por defecto configurado en el servidor. El cambio tarda hasta 1 minuto en aplicar (caché interna).</p>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </div>
  )
}

// ─── SISTEMA ────────────────────────────────────────────────────────────────

const ZONAS_HORARIAS = [
  { value: 'America/Bogota',    label: 'Bogotá (UTC-5)' },
  { value: 'America/Lima',      label: 'Lima (UTC-5)' },
  { value: 'America/Guayaquil', label: 'Quito (UTC-5)' },
]

function TabSistema() {
  const [zonaHoraria, setZonaHoraria] = useState('')
  const [dominioCorreo, setDominioCorreo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingDominio, setSavingDominio] = useState(false)

  useEffect(() => {
    fetchSettings('sistema')
      .then(settings => {
        const porClave = asMap(settings)
        setZonaHoraria(porClave.zona_horaria || 'America/Bogota')
        setDominioCorreo(porClave.dominio_correo || '')
      })
      .catch(e => console.error('Error cargando sistema:', e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveZona = async () => {
    setSaving(true)
    try {
      await saveSetting('sistema', 'zona_horaria', zonaHoraria)
      toastExito('Zona horaria guardada')
    } catch (e) {
      alertError(e.message)
    }
    setSaving(false)
  }

  const handleSaveDominio = async () => {
    setSavingDominio(true)
    try {
      const limpio = dominioCorreo.trim().toLowerCase().replace(/^@/, '')
      await saveSetting('sistema', 'dominio_correo', limpio)
      setDominioCorreo(limpio)
      toastExito('Dominio de correo guardado')
    } catch (e) {
      alertError(e.message)
    }
    setSavingDominio(false)
  }

  const handlePurgar = () => {
    clearCache()
    toastExito('Caché purgada. Los módulos pedirán datos frescos al volver a entrar.')
  }

  return (
    <div className="modal-form" style={{ maxWidth: 480 }}>
      {loading ? <div className="loading-box"><span className="loader"></span>Cargando...</div> : (
        <>
          <div className="modal-field">
            <label>Zona horaria</label>
            <select className="filter-select" value={zonaHoraria} onChange={e => setZonaHoraria(e.target.value)}>
              {ZONAS_HORARIAS.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
            <button className="btn-primary" onClick={handleSaveZona} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
          <div className="modal-field" style={{ marginTop: 16 }}>
            <label>Dominio de correo institucional</label>
            <input value={dominioCorreo} onChange={e => setDominioCorreo(e.target.value)} placeholder="pascualbravovirtual.edu.co" />
            <p className="modal-hint" style={{ marginTop: 4 }}>
              Si se llena, al crear usuarios a mano, por Carga Masiva o desde SICAU se exige que el correo termine en "@{dominioCorreo || 'dominio.edu.co'}" —
              si no coincide, no se crea el usuario (en SICAU queda como error en Sync &gt; Novedades). Vacío = sin validar.
            </p>
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
            <button className="btn-primary" onClick={handleSaveDominio} disabled={savingDominio}>{savingDominio ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </>
      )}
      <div className="modal-field">
        <label>Caché de pantallas (Sync Usuarios, Módulos, etc.)</label>
        <p className="modal-hint" style={{ marginTop: 0 }}>Borra los datos que quedaron en memoria de esta sesión para forzar que se vuelvan a pedir al servidor.</p>
      </div>
      <div className="modal-actions" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
        <button className="btn-secondary" onClick={handlePurgar}>Purgar caché</button>
      </div>
    </div>
  )
}

// ─── PÁGINA ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'apariencia', label: 'Apariencia' },
  { key: 'academico',  label: 'Académico' },
  { key: 'home',       label: 'Home' },
  { key: 'menu',        label: 'Menú' },
  { key: 'moodle',      label: 'Moodle' },
  { key: 'sistema',     label: 'Sistema' },
]

export default function Configuracion() {
  const [tab, setTab] = useState('apariencia')

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Configuración</h2>
      </div>

      <div className="novedades-tabs" role="tablist" aria-label="Categoría de configuración">
        {TABS.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'apariencia' && <TabApariencia />}
      {tab === 'academico' && <TabAcademico />}
      {tab === 'home' && <TabHome />}
      {tab === 'menu' && <TabMenu />}
      {tab === 'moodle' && <TabMoodle />}
      {tab === 'sistema' && <TabSistema />}
    </div>
  )
}
