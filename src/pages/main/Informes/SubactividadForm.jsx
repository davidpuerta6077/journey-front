import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import { createRegistro } from '../../../services/onix/createRegistro'
import { updateRegistro } from '../../../services/onix/updateRegistro'
import { addEvidencia } from '../../../services/onix/addEvidencia'
import { alertError, toastExito } from '../../../services/alerts'
import ImagenesDrop from './ImagenesDrop'
import Miniatura from './Miniatura'
import { tituloDe } from './evidencias'

// Crear (con imágenes y enlaces en el mismo paso) o editar una subactividad.
export default function SubactividadForm({ actividadId, periodo, registro = null, onGuardado, onCancelar }) {
  const [titulo, setTitulo] = useState(registro ? tituloDe(registro) : '')
  const [desarrollo, setDesarrollo] = useState(registro?.desarrollo || '')
  const [imagenes, setImagenes] = useState([])
  const [enlaces, setEnlaces] = useState([])
  const [enlace, setEnlace] = useState('')
  const [enviando, setEnviando] = useState(false)
  const idBase = `sub-${registro?.id || `nueva-${actividadId}`}`

  const agregarEnlace = () => {
    const url = enlace.trim()
    if (!/^https?:\/\/\S+$/i.test(url)) return alertError('El enlace debe empezar por http:// o https://')
    setEnlaces((l) => [...l, url])
    setEnlace('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      if (registro) {
        await updateRegistro(registro.id, { titulo, desarrollo })
        toastExito('Subactividad guardada')
        return onGuardado()
      }
      const nuevo = await createRegistro({ actividad_id: actividadId, ...periodo, titulo, desarrollo })
      const pendientes = [
        ...imagenes.map((archivo) => ({ registro_id: nuevo.id, tipo: 'imagen', archivo })),
        ...enlaces.map((contenido) => ({ registro_id: nuevo.id, tipo: 'link', contenido })),
      ]
      const fallos = []
      for (const ev of pendientes) {
        try {
          await addEvidencia(ev)
        } catch (err) {
          fallos.push(err.message)
        }
      }
      if (fallos.length) alertError(`La subactividad se guardó, pero ${fallos.length} evidencia(s) no se pudieron subir: ${fallos[0]}`)
      else toastExito('Subactividad agregada')
      onGuardado()
    } catch (err) {
      alertError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="onix-card onix-sub-form" onSubmit={guardar}>
      <h5 className="onix-sub-titulo">{registro ? 'Editar subactividad' : 'Nueva subactividad'}</h5>
      <div className="modal-field">
        <label htmlFor={`${idBase}-titulo`}>Título *</label>
        <input id={`${idBase}-titulo`} value={titulo} onChange={(e) => setTitulo(e.target.value)}
          maxLength={200} required autoFocus placeholder="Ej. Implementación del micrositio CELEP" />
      </div>
      <div className="modal-field">
        <label htmlFor={`${idBase}-desc`}>¿Qué hiciste? *</label>
        <textarea id={`${idBase}-desc`} rows={5} value={desarrollo} onChange={(e) => setDesarrollo(e.target.value)} required
          placeholder="Escribe con tus palabras lo que hiciste. La IA lo organiza en el párrafo del informe y en el documento de evidencia." />
      </div>

      {!registro && (
        <>
          <span className="onix-num">Evidencias (opcional, también puedes agregarlas después)</span>
          {(imagenes.length > 0 || enlaces.length > 0) && (
            <div className="onix-evidencias">
              {imagenes.map((f, i) => <Miniatura key={`${f.name}-${i}`} file={f} onQuitar={() => setImagenes((l) => l.filter((_, j) => j !== i))} />)}
              {enlaces.map((u, i) => (
                <div key={u} className="onix-evidencia">
                  <Link2 size={13} /> <span>{u}</span>
                  <button type="button" className="btn-icon btn-icon-delete" title="Quitar enlace" aria-label={`Quitar ${u}`} onClick={() => setEnlaces((l) => l.filter((_, j) => j !== i))}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <ImagenesDrop onArchivos={(files) => setImagenes((l) => [...l, ...files])} disabled={enviando} />
          <div className="onix-enlace-form">
            <input type="url" className="filter-select" placeholder="https://... (enlace de evidencia)" aria-label="Enlace de evidencia" value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarEnlace() } }} />
            <button type="button" className="btn-secondary" onClick={agregarEnlace} disabled={!enlace.trim()}>Agregar enlace</button>
          </div>
        </>
      )}

      <div className="onix-acciones onix-acciones-fin">
        <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  )
}
