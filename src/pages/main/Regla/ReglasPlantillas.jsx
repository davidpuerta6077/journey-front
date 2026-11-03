import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import ExportMenu from '../../../components/ExportMenu'
import { fetchMoodleCategorias } from '../../../services/admin/fetchMoodleCategorias'
import { fetchMoodleSemillas } from '../../../services/admin/fetchMoodleSemillas'
import "../../../styles/main/Sync/SyncUsuariosP.css"

// navigator.clipboard requiere un contexto seguro (HTTPS o localhost): si la
// app se sirve por HTTP en un dominio interno, navigator.clipboard es
// undefined y el `?.` hacía que el botón no copiara NADA sin avisar — parecía
// "no funciona" porque fallaba en silencio. Este fallback con un textarea
// oculto + execCommand('copy') funciona igual en esos casos.
function copyToClipboard(value) {
  const text = String(value)
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyToClipboardFallback(text))
  }
  return Promise.resolve(copyToClipboardFallback(text))
}

function copyToClipboardFallback(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try { document.execCommand('copy') } catch { /* nada más que intentar */ }
  document.body.removeChild(textarea)
}

function CopyButton({ value, title }) {
  const [copied, setCopied] = useState(false)
  const handleClick = async () => {
    await copyToClipboard(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button className="btn-icon" onClick={handleClick} title={copied ? 'Copiado' : title}>
      {copied ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
    </button>
  )
}

// Texto de cada columna tal como se ve en la celda (para el filtro por columna).
const CAT_GETTERS = {
  id:          c => c.id,
  name:        c => c.name,
  idnumber:    c => c.idnumber || '-',
  parent:      c => c.parent || '-',
  coursecount: c => c.coursecount ?? '-',
}
const SEMILLA_GETTERS = {
  id:        s => s.id,
  shortname: s => s.shortname,
  fullname:  s => s.fullname,
  categoria: s => s.categoryname || s.categoryid || '-',
}
// Columnas para exportar (mismo texto de la celda, con el título del encabezado).
const CAT_EXPORT = Object.entries({ id: 'ID', name: 'Nombre', idnumber: 'Idnumber', parent: 'Padre', coursecount: 'Cursos' }).map(([k, label]) => ({ label, get: CAT_GETTERS[k] }))
const SEMILLA_EXPORT = Object.entries({ id: 'ID', shortname: 'Shortname', fullname: 'Nombre completo', categoria: 'Categoría' }).map(([k, label]) => ({ label, get: SEMILLA_GETTERS[k] }))

export default function ReglasPlantillas() {
  const [categorias, setCategorias]           = useState([])
  const [semillas, setSemillas]               = useState([])
  const [semillasCategoryId, setSemillasCategoryId] = useState('')
  const [loading, setLoading]                 = useState(true)
  const [loadingSemillas, setLoadingSemillas]  = useState(false)
  const [error, setError]                     = useState('')
  const catFiltro = useColumnFilters(categorias, CAT_GETTERS)
  const semFiltro = useColumnFilters(semillas, SEMILLA_GETTERS)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cats, seeds] = await Promise.all([
        fetchMoodleCategorias(),
        fetchMoodleSemillas(semillasCategoryId || undefined)
      ])
      setCategorias(cats)
      setSemillas(seeds)
    } catch (e) {
      console.error('Error cargando plantillas de Moodle:', e.message)
      setError(e.message)
    }
    setLoading(false)
  }, [semillasCategoryId])

  useEffect(() => { loadData() }, [loadData])

  const handleCategoriaSemillasChange = async (e) => {
    const value = e.target.value
    setSemillasCategoryId(value)
    setLoadingSemillas(true)
    setError('')
    try {
      setSemillas(await fetchMoodleSemillas(value || undefined))
    } catch (e) {
      console.error('Error cargando cursos semilla:', e.message)
      setError(e.message)
    }
    setLoadingSemillas(false)
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Reglas — Plantillas</h2>
        <button className="btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>
      <p className="permisos-intro">
        Catálogo en vivo, leído directo de Moodle — no se crea ni edita nada aquí. Úsalo como
        referencia para llenar <code>categoryid</code> y <code>seed_shortname</code> al crear
        una regla en <strong>Reglas Activas</strong>.
      </p>

      {error && <div className="modal-error permisos-save-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Consultando Moodle...</div>
      ) : (
        <>
          <div className="sync-page-header" style={{ marginTop: 8 }}>
            <h3>Categorías de Moodle</h3>
            <ExportMenu title="Categorías de Moodle" columns={CAT_EXPORT} rows={catFiltro.filtered} allRows={categorias} />
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><ColumnFilter label="ID" {...catFiltro.colProps('id')} /></th>
                  <th><ColumnFilter label="Nombre" {...catFiltro.colProps('name')} /></th>
                  <th><ColumnFilter label="Idnumber" {...catFiltro.colProps('idnumber')} /></th>
                  <th><ColumnFilter label="Padre" {...catFiltro.colProps('parent')} /></th>
                  <th><ColumnFilter label="Cursos" {...catFiltro.colProps('coursecount')} /></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {catFiltro.filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No se encontraron categorías.</td></tr>
                )}
                {catFiltro.filtered.map(cat => (
                  <tr key={cat.id}>
                    <td data-label="ID"><code>{cat.id}</code></td>
                    <td data-label="Nombre">{cat.name}</td>
                    <td data-label="Idnumber">{cat.idnumber || '-'}</td>
                    <td data-label="Padre">{cat.parent || '-'}</td>
                    <td data-label="Cursos">{cat.coursecount ?? '-'}</td>
                    <td data-label="Copiar">
                      <CopyButton value={cat.id} title="Copiar categoryid" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sync-page-header" style={{ marginTop: 24 }}>
            <h3>Cursos semilla</h3>
            <div className="modal-field" style={{ margin: 0, minWidth: 280 }}>
              <select value={semillasCategoryId} onChange={handleCategoriaSemillasChange} disabled={loadingSemillas}>
                <option value="">Categoría por defecto (id 1)</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} (id {cat.id})</option>
                ))}
              </select>
            </div>
            <ExportMenu title="Cursos semilla" columns={SEMILLA_EXPORT} rows={semFiltro.filtered} allRows={semillas} />
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><ColumnFilter label="ID" {...semFiltro.colProps('id')} /></th>
                  <th><ColumnFilter label="Shortname" {...semFiltro.colProps('shortname')} /></th>
                  <th><ColumnFilter label="Nombre completo" {...semFiltro.colProps('fullname')} /></th>
                  <th><ColumnFilter label="Categoría" {...semFiltro.colProps('categoria')} /></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loadingSemillas && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>Consultando Moodle...</td></tr>
                )}
                {!loadingSemillas && semFiltro.filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No se encontraron cursos semilla en esta categoría.</td></tr>
                )}
                {!loadingSemillas && semFiltro.filtered.map(s => (
                  <tr key={s.id}>
                    <td data-label="ID"><code>{s.id}</code></td>
                    <td data-label="Shortname"><code>{s.shortname}</code></td>
                    <td data-label="Nombre completo">{s.fullname}</td>
                    <td data-label="Categoría">{s.categoryname || s.categoryid || '-'}</td>
                    <td data-label="Copiar">
                      <CopyButton value={s.shortname} title="Copiar shortname" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
