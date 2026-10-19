import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react'
import { listarPaginas } from '../../../services/codex/listarPaginas'
import { crearPagina } from '../../../services/codex/crearPagina'
import { renombrarPagina } from '../../../services/codex/renombrarPagina'
import { duplicarPagina } from '../../../services/codex/duplicarPagina'
import { borrarPagina } from '../../../services/codex/borrarPagina'
import { alertError, confirmEliminar, pedirTexto, toastExito } from '../../../services/alerts'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Codex/Codex.css'

const fecha = (v) => new Date(v).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export default function CodexPaginas() {
  const navigate = useNavigate()
  const [paginas, setPaginas] = useState(null) // null = cargando

  const cargar = () => listarPaginas()
    .then((lista) => setPaginas(lista || []))
    .catch((e) => { setPaginas([]); alertError(e.message) })

  useEffect(() => { cargar() }, [])

  const nueva = async () => {
    const nombre = await pedirTexto({ title: 'Nueva página', confirmButtonText: 'Crear' })
    if (!nombre) return
    try {
      const p = await crearPagina(nombre)
      navigate(`/codex/${p.id}`)
    } catch (e) { alertError(e.message) }
  }

  const renombrar = async (p) => {
    const nombre = await pedirTexto({ title: 'Renombrar página', inputValue: p.nombre })
    if (!nombre || nombre === p.nombre) return
    try { await renombrarPagina(p.id, nombre); toastExito('Página renombrada'); cargar() } catch (e) { alertError(e.message) }
  }

  const duplicar = async (p) => {
    try { await duplicarPagina(p.id); toastExito('Página duplicada'); cargar() } catch (e) { alertError(e.message) }
  }

  const borrar = async (p) => {
    const ok = await confirmEliminar({ title: '¿Borrar la página?', text: `"${p.nombre}" se borrará y no se puede recuperar.`, confirmButtonText: 'Sí, borrar' })
    if (!ok) return
    try { await borrarPagina(p.id); toastExito('Página borrada'); cargar() } catch (e) { alertError(e.message) }
  }

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>CodeX — Mis páginas</h2>
        <button className="btn-primary" onClick={nueva}><Plus size={16} /> Nueva página</button>
      </div>

      {paginas === null ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : paginas.length === 0 ? (
        <p className="codex-vacio">Aún no tienes páginas. Crea la primera con "Nueva página".</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Nombre</th><th>Última modificación</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paginas.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nombre"><button className="codex-nombre-link" onClick={() => navigate(`/codex/${p.id}`)}>{p.nombre}</button></td>
                  <td data-label="Última modificación">{fecha(p.updated_at)}</td>
                  <td data-label="Acciones">
                    <div className="action-btns">
                      <button className="btn-icon btn-icon-edit" title="Renombrar" aria-label={`Renombrar ${p.nombre}`} onClick={() => renombrar(p)}><Pencil size={15} /></button>
                      <button className="btn-icon btn-icon-edit" title="Duplicar" aria-label={`Duplicar ${p.nombre}`} onClick={() => duplicar(p)}><Copy size={15} /></button>
                      <button className="btn-icon btn-icon-delete" title="Borrar" aria-label={`Borrar ${p.nombre}`} onClick={() => borrar(p)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
