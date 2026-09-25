import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
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

export default function ReglasPlantillas() {
  const [categorias, setCategorias]           = useState([])
  const [semillas, setSemillas]               = useState([])
  const [semillasCategoryId, setSemillasCategoryId] = useState('')
  const [loading, setLoading]                 = useState(true)
  const [loadingSemillas, setLoadingSemillas]  = useState(false)
  const [error, setError]                     = useState('')

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
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Idnumber</th><th>Padre</th><th>Cursos</th><th></th></tr>
              </thead>
              <tbody>
                {categorias.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No se encontraron categorías.</td></tr>
                )}
                {categorias.map(cat => (
                  <tr key={cat.id}>
                    <td><code>{cat.id}</code></td>
                    <td>{cat.name}</td>
                    <td>{cat.idnumber || '-'}</td>
                    <td>{cat.parent || '-'}</td>
                    <td>{cat.coursecount ?? '-'}</td>
                    <td>
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
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Shortname</th><th>Nombre completo</th><th>Categoría</th><th></th></tr>
              </thead>
              <tbody>
                {loadingSemillas && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>Consultando Moodle...</td></tr>
                )}
                {!loadingSemillas && semillas.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No se encontraron cursos semilla en esta categoría.</td></tr>
                )}
                {!loadingSemillas && semillas.map(s => (
                  <tr key={s.id}>
                    <td><code>{s.id}</code></td>
                    <td><code>{s.shortname}</code></td>
                    <td>{s.fullname}</td>
                    <td>{s.categoryname || s.categoryid || '-'}</td>
                    <td>
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
