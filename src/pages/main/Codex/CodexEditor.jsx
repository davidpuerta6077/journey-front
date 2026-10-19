import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Moon, Sun } from 'lucide-react'
import { obtenerPagina } from '../../../services/codex/obtenerPagina'
import { guardarBloques } from '../../../services/codex/guardarBloques'
import { renombrarPagina } from '../../../services/codex/renombrarPagina'
import { alertError, pedirTexto, toastExito } from '../../../services/alerts'
import { crearGuardador } from './guardador'
import { crearSesion } from './sesion'
import { fetchSettings } from '../../../services/settings/fetchSettings'
import { applyAppearance } from '../../../services/settings/applyAppearance'
import '../../../styles/main/Codex/Codex.css'

const hora = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
const EDITOR_URL = `${import.meta.env.BASE_URL}codex-editor.html`

// Colores, fuente y claro/oscuro actuales del hub, para que el editor se vea igual.
function leerTema() {
  const css = getComputedStyle(document.documentElement)
  const v = (n) => css.getPropertyValue(n).trim()
  return {
    oscuro: document.documentElement.getAttribute('data-theme') === 'dark',
    primario: v('--primary'),
    menu: v('--menu-bg') || '#1e3a6e',
    fondo: v('--bg-page'),
    fuente: v('--font-base'),
  }
}

// Editor a pantalla completa (fuera del layout con menú). El editor
// (codex-editor.html) corre en un iframe del mismo origen: sus estilos no se
// mezclan con los del hub. Este componente le pasa la página y guarda en la
// API lo que el editor le avisa (ver src/codex/bridge.ts).
export default function CodexEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const iframeRef = useRef(null)
  const [pagina, setPagina] = useState(null)
  const [nombre, setNombre] = useState('')
  const nombreRef = useRef('')
  const salirRef = useRef(null)
  const [saliendo, setSaliendo] = useState(false)
  const [tema, setTema] = useState(() => localStorage.getItem('bravohub_theme') || 'light')

  const avisarTema = () => iframeRef.current?.contentWindow?.postMessage({ tipo: 'codex:tema', tema: leerTema() }, window.location.origin)

  // Esta ruta va fuera del layout con menú: aplica aquí el tema y la apariencia del hub.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('bravohub_theme', tema)
    avisarTema()
  }, [tema])

  useEffect(() => {
    fetchSettings('apariencia').then((settings) => { applyAppearance(settings); avisarTema() }).catch(() => {})
  }, [])
  useEffect(() => { nombreRef.current = nombre }, [nombre])

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

  // useLayoutEffect: su limpieza corre antes de quitar el iframe del DOM, así
  // al salir todavía se puede leer el estado del editor que no alcanzó a enviar.
  useLayoutEffect(() => {
    if (!pagina) return
    const frame = iframeRef.current
    const avisarEditor = (msg) => frame?.contentWindow?.postMessage(msg, window.location.origin)
    const leerActual = () => {
      try { return frame?.contentWindow?.codexBloquesActuales?.() } catch { return undefined }
    }
    const g = crearGuardador({
      guardar: (bloques) => guardarBloques(pagina.id, bloques),
      onGuardado: () => avisarEditor({ tipo: 'codex:saved', hora: hora() }),
      onError: (e) => avisarEditor({
        tipo: 'codex:save-error',
        mensaje: e.status === 413 ? 'La página es demasiado grande para guardar' : 'Error al guardar',
      }),
    })
    g.inicial(pagina.bloques)
    const sesion = crearSesion({ bloques: pagina.bloques, guardador: g })
    salirRef.current = () => sesion.salir(leerActual)

    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== frame?.contentWindow) return
      const respuesta = sesion.mensaje(e.data)
      if (respuesta) avisarEditor(respuesta.tipo === 'codex:load' ? { ...respuesta, tema: leerTema() } : respuesta)
    }
    // Cerrar la pestaña con cambios sin guardar: se intenta guardar y el
    // navegador pregunta antes de salir.
    const onBeforeUnload = (e) => {
      sesion.salir(leerActual)
      if (!g.hayPendiente()) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onBeforeUnload)
      // Salir de la ruta (ej. "Mis páginas") guarda lo pendiente; si falla, se avisa.
      sesion.salir(leerActual).then((ok) => {
        if (!ok) alertError(`No se pudieron guardar los últimos cambios de "${nombreRef.current}". Ábrela de nuevo para revisarla.`)
      })
    }
  }, [pagina])

  // "Mis páginas" espera a que se guarde; si falla, se queda en el editor (nada se pierde).
  const volver = async () => {
    setSaliendo(true)
    const ok = await salirRef.current?.()
    setSaliendo(false)
    if (ok === false) {
      alertError('No se pudieron guardar los últimos cambios. Revisa tu conexión e intenta de nuevo.')
      return
    }
    navigate('/codex')
  }

  const renombrar = async () => {
    const nuevo = await pedirTexto({ title: 'Renombrar página', inputValue: nombre })
    if (!nuevo || nuevo === nombre) return
    try { await renombrarPagina(pagina.id, nuevo); setNombre(nuevo); toastExito('Página renombrada') } catch (e) { alertError(e.message) }
  }

  if (!pagina) return <div className="loading-box" style={{ minHeight: '100dvh' }}><span className="loader"></span>Cargando...</div>

  return (
    <div className="codex-editor">
      <div className="codex-editor-barra">
        <button className="btn-secondary" onClick={volver} disabled={saliendo}><ArrowLeft size={16} /> {saliendo ? 'Guardando...' : 'Mis páginas'}</button>
        <h1 className="codex-editor-nombre" title={nombre}>{nombre}</h1>
        <button className="btn-icon btn-icon-edit" title="Renombrar" aria-label="Renombrar página" onClick={renombrar}><Pencil size={15} /></button>
        <button
          className="btn-icon codex-editor-tema"
          onClick={() => setTema((t) => (t === 'dark' ? 'light' : 'dark'))}
          title={tema === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          aria-label={tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {tema === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src={EDITOR_URL}
        title={`Editor C0deX: ${nombre}`}
        className="codex-editor-frame"
        allow="clipboard-write"
      />
    </div>
  )
}
