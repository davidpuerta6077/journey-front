import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Copy, Trash2, LayoutTemplate } from 'lucide-react'
import { listarPaginas } from '../../../services/codex/listarPaginas'
import { crearPagina } from '../../../services/codex/crearPagina'
import { renombrarPagina } from '../../../services/codex/renombrarPagina'
import { duplicarPagina } from '../../../services/codex/duplicarPagina'
import { borrarPagina } from '../../../services/codex/borrarPagina'
import { alertError, confirmEliminar, pedirTexto, toastExito } from '../../../services/alerts'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Codex/Codex.css'
import '../../../styles/main/Informes/Informes.css'

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
    // Mismo lenguaje visual que Onix-IA (clases onix-* de Informes.css): lista sin tabla, acciones como texto
    <div className="sync-page onix-root">
      <div className="sync-page-header">
        <div>
          <h2>C0deX</h2>
          <p className="onix-sub">Arma páginas web con el constructor visual, sin escribir código.</p>
        </div>
        <button className="btn-primary" onClick={nueva}><Plus size={16} /> Nueva página</button>
      </div>

      <section className="onix-mes onix-seccion" aria-labelledby="codex-paginas">
        <h4 id="codex-paginas">Mis páginas {paginas?.length > 0 && <span className="onix-lista-total">{paginas.length}</span>}</h4>
        <p className="onix-seccion-ayuda">Haz clic en una página para abrirla en el constructor.</p>

        {paginas === null ? (
          <div className="loading-box"><span className="loader"></span>Cargando...</div>
        ) : paginas.length === 0 ? (
          <p className="onix-vacio-texto">Aún no tienes páginas. Crea la primera con "Nueva página".</p>
        ) : (
          <ol className="onix-actividades">
            {paginas.map((p) => (
              <li key={p.id} className="onix-actividad-fila onix-actividad-config codex-pagina">
                <button type="button" className="codex-pagina-abrir" onClick={() => navigate(`/codex/${p.id}`)}>
                  <span className="onix-act-num" aria-hidden="true"><LayoutTemplate size={18} /></span>
                  <span className="onix-actividad-info">
                    <span className="onix-actividad-nombre">{p.nombre}</span>
                    <span className="onix-actividad-desc">Modificada el {fecha(p.updated_at)}</span>
                  </span>
                </button>
                <span className="onix-fila-acciones">
                  <button type="button" className="onix-texto-btn" aria-label={`Renombrar ${p.nombre}`} onClick={() => renombrar(p)}><Pencil size={15} /> Renombrar</button>
                  <button type="button" className="onix-texto-btn" aria-label={`Duplicar ${p.nombre}`} onClick={() => duplicar(p)}><Copy size={15} /> Duplicar</button>
                  <button type="button" className="onix-texto-btn onix-texto-peligro" aria-label={`Borrar ${p.nombre}`} onClick={() => borrar(p)}><Trash2 size={15} /> Borrar</button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
