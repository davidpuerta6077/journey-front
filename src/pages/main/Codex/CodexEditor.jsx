import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { obtenerPagina } from '../../../services/codex/obtenerPagina'
import { guardarBloques } from '../../../services/codex/guardarBloques'
import { renombrarPagina } from '../../../services/codex/renombrarPagina'
import { alertError, pedirTexto, toastExito } from '../../../services/alerts'
import { crearGuardador } from './guardador'
import '../../../styles/main/Codex/Codex.css'

const hora = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
const EDITOR_URL = `${import.meta.env.BASE_URL}codex.html`

// El editor (codex.html) corre en un iframe del mismo origen: sus estilos no
// se mezclan con los del hub. Este componente le pasa la página y guarda en la
// API lo que el editor le avisa (ver src/codex/bridge.ts).
export default function CodexEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const iframeRef = useRef(null)
  const [pagina, setPagina] = useState(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    let vivo = true
    obtenerPagina(id)
      .then((p) => { if (vivo) { setPagina(p); setNombre(p.nombre) } })
      .catch((e) => {
        if (!vivo) return
        alertError(e.status === 404 ? 'La página no existe o no es tuya' : e.message)
        navigate('/codex', { replace: true })
      })
    return () => { vivo = false }
  }, [id, navigate])

  useEffect(() => {
    if (!pagina) return
    const avisarEditor = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin)
    const g = crearGuardador({
      guardar: (bloques) => guardarBloques(pagina.id, bloques),
      onGuardado: () => avisarEditor({ tipo: 'codex:saved', hora: hora() }),
      onError: (e) => avisarEditor({
        tipo: 'codex:save-error',
        mensaje: e.status === 413 ? 'La página es demasiado grande para guardar' : 'Error al guardar',
      }),
    })
    g.inicial(pagina.bloques)

    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.tipo === 'codex:ready') avisarEditor({ tipo: 'codex:load', bloques: pagina.bloques })
      else if (e.data?.tipo === 'codex:change' && Array.isArray(e.data.bloques)) g.cambio(e.data.bloques)
    }
    // Cerrar la pestaña con cambios sin guardar: se intenta guardar y el
    // navegador pregunta antes de salir.
    const onBeforeUnload = (e) => {
      if (!g.hayPendiente()) return
      g.vaciar()
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onBeforeUnload)
      g.vaciar() // salir de la ruta (ej. "Mis páginas") guarda lo pendiente
    }
  }, [pagina])

  const renombrar = async () => {
    const nuevo = await pedirTexto({ title: 'Renombrar página', inputValue: nombre })
    if (!nuevo || nuevo === nombre) return
    try { await renombrarPagina(pagina.id, nuevo); setNombre(nuevo); toastExito('Página renombrada') } catch (e) { alertError(e.message) }
  }

  if (!pagina) return <div className="loading-box"><span className="loader"></span>Cargando...</div>

  return (
    <div className="codex-editor">
      <div className="codex-editor-barra">
        <button className="btn-secondary" onClick={() => navigate('/codex')}><ArrowLeft size={16} /> Mis páginas</button>
        <h2 className="codex-editor-nombre" title={nombre}>{nombre}</h2>
        <button className="btn-icon btn-icon-edit" title="Renombrar" aria-label="Renombrar página" onClick={renombrar}><Pencil size={15} /></button>
      </div>
      <iframe
        ref={iframeRef}
        src={EDITOR_URL}
        title={`Editor CodeX: ${nombre}`}
        className="codex-editor-frame"
        allow="clipboard-write"
      />
    </div>
  )
}
