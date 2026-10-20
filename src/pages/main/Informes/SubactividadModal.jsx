import { useState } from 'react'
import { Trash2, X, Link2, Sparkles, Save, FileDown } from 'lucide-react'
import { addEvidencia } from '../../../services/onix/addEvidencia'
import { updateEvidencia } from '../../../services/onix/updateEvidencia'
import { deleteEvidencia } from '../../../services/onix/deleteEvidencia'
import { deleteRegistro } from '../../../services/onix/deleteRegistro'
import { updateRegistro } from '../../../services/onix/updateRegistro'
import { generarSubactividad } from '../../../services/onix/generarSubactividad'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError, confirmAccion, confirmEliminar, toastExito } from '../../../services/alerts'
import EvidenciaImagen from './EvidenciaImagen'
import ImagenesDrop from './ImagenesDrop'
import Redactando from './Redactando'
import { tituloDe, generada } from './evidencias'

// Pie de una imagen: se guarda al salir del campo si cambió.
function PieImagen({ evidencia, onGuardado }) {
  const [texto, setTexto] = useState(evidencia.descripcion || '')
  const guardar = async () => {
    if (texto.trim() === (evidencia.descripcion || '')) return
    try {
      await updateEvidencia(evidencia.id, { descripcion: texto })
      onGuardado()
    } catch (e) {
      alertError(e.message)
    }
  }
  return (
    <input className="onix-pie" value={texto} maxLength={500} placeholder="Describe la imagen (opcional)"
      aria-label="Descripción de la imagen" onChange={(e) => setTexto(e.target.value)} onBlur={guardar} />
  )
}

// Todo lo de una subactividad en un solo lugar: datos, evidencias, texto de la IA y Word.
export default function SubactividadModal({ registro: r, numero, soloLectura = false, perfilCompleto = true, bloqueado = false, onCerrar, onCambio, onActualizado }) {
  const [titulo, setTitulo] = useState(tituloDe(r))
  const [desarrollo, setDesarrollo] = useState(r.desarrollo || '')
  const [parrafo, setParrafo] = useState(r.parrafo || '')
  const [parrafoBase, setParrafoBase] = useState(r.parrafo)
  const [enlace, setEnlace] = useState(null) // null = formulario oculto
  const [subiendo, setSubiendo] = useState(false)
  const [ocupado, setOcupado] = useState(null)

  // Al generar o recargar, el texto en edición toma el párrafo nuevo.
  if (parrafoBase !== r.parrafo) {
    setParrafoBase(r.parrafo)
    setParrafo(r.parrafo || '')
  }

  const datosCambiados = titulo.trim() !== tituloDe(r) || desarrollo !== (r.desarrollo || '')
  const parrafoCambiado = !!r.parrafo && parrafo !== r.parrafo
  const ocupadoAlgo = ocupado !== null || bloqueado
  const lista = generada(r)
  const imagenes = r.evidencias.filter((e) => e.tipo === 'imagen')
  const otras = r.evidencias.filter((e) => e.tipo !== 'imagen')

  const conOcupado = async (clave, fn) => {
    setOcupado(clave)
    try {
      await fn()
    } catch (e) {
      alertError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const cerrar = async () => {
    if ((datosCambiados || parrafoCambiado) && !(await confirmAccion({
      title: '¿Cerrar sin guardar?', text: 'Tienes cambios sin guardar en esta subactividad.', confirmButtonText: 'Sí, cerrar',
    }))) return
    onCerrar()
  }

  const guardarDatos = () => conOcupado('datos', async () => {
    if (!titulo.trim() || !desarrollo.trim()) throw new Error('El título y "¿Qué hiciste?" son obligatorios')
    onActualizado({ ...r, ...(await updateRegistro(r.id, { titulo: titulo.trim(), desarrollo })) })
    toastExito('Cambios guardados')
  })

  // Sube en orden; si una falla, las anteriores quedan y se recarga igual.
  const subirImagenes = async (archivos) => {
    setSubiendo(true)
    let subidas = 0
    try {
      for (const archivo of archivos) {
        await addEvidencia({ registro_id: r.id, tipo: 'imagen', archivo })
        subidas++
      }
      toastExito(subidas === 1 ? 'Imagen agregada' : `${subidas} imágenes agregadas`)
    } catch (e) {
      alertError(`${subidas} de ${archivos.length} imágenes subidas. ${e.message}`)
    } finally {
      setSubiendo(false)
      onCambio()
    }
  }

  const guardarEnlace = async (e) => {
    e.preventDefault()
    setSubiendo(true)
    try {
      await addEvidencia({ registro_id: r.id, tipo: 'link', contenido: enlace.trim() })
      setEnlace(null)
      onCambio()
    } catch (err) {
      alertError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  const quitarEvidencia = async (ev) => {
    if (!(await confirmEliminar({ text: 'Se quitará esta evidencia.' }))) return
    try {
      await deleteEvidencia(ev.id)
      onCambio()
    } catch (e) {
      alertError(e.message)
    }
  }

  const eliminar = async () => {
    if (!(await confirmEliminar({ text: `Se eliminará "${tituloDe(r)}" con sus evidencias.` }))) return
    try {
      await deleteRegistro(r.id)
      toastExito('Subactividad eliminada')
      onCerrar()
      onCambio()
    } catch (e) {
      alertError(e.message)
    }
  }

  const generar = () => conOcupado('generar', async () => {
    if (datosCambiados) throw new Error('Guarda primero los cambios del título o de "¿Qué hiciste?"')
    if (r.parrafo && !(await confirmAccion({
      title: '¿Redactar de nuevo?',
      text: parrafoCambiado
        ? 'Se reemplazarán el párrafo (incluidos tus cambios sin guardar) y el documento de evidencia.'
        : 'Se reemplazarán el párrafo y el documento de evidencia.',
      confirmButtonText: 'Sí, redactar',
    }))) return
    onActualizado(await generarSubactividad(r.id))
    toastExito('Texto y documento de evidencia listos')
  })

  const guardarParrafo = () => conOcupado('parrafo', async () => {
    onActualizado({ ...r, ...(await updateRegistro(r.id, { desarrollo: r.desarrollo, parrafo })) })
    toastExito('Párrafo guardado')
  })

  const descargar = () => conOcupado('word', async () => {
    if (parrafoCambiado) onActualizado({ ...r, ...(await updateRegistro(r.id, { desarrollo: r.desarrollo, parrafo })) })
    await descargarArchivo(`/registros/${r.id}/word`, undefined, `${tituloDe(r)}.docx`)
  })

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && cerrar()}>
      <div className="modal-box onix-sub-modal" role="dialog" aria-modal="true" aria-labelledby={`sub-${r.id}-titulo`}>
        <div className="modal-header">
          <div>
            <span className="onix-num">Subactividad {numero}</span>
            <h3 id={`sub-${r.id}-titulo`}>{tituloDe(r)}</h3>
          </div>
          <button type="button" className="modal-close" onClick={cerrar} aria-label="Cerrar">×</button>
        </div>

        <div className="modal-form onix-sub-modal-body">
          {/* 1. Qué hiciste */}
          <section className="onix-bloque">
            <h4 className="onix-bloque-titulo"><span className="onix-paso-num">1</span> Qué hiciste</h4>
            {soloLectura ? (
              <p className="onix-registro-texto">{r.desarrollo}</p>
            ) : (
              <>
                <div className="modal-field">
                  <label htmlFor={`sub-${r.id}-t`}>Título</label>
                  <input id={`sub-${r.id}-t`} value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} />
                </div>
                <div className="modal-field">
                  <label htmlFor={`sub-${r.id}-d`}>Descripción (tus palabras; la IA la redacta formal)</label>
                  <textarea id={`sub-${r.id}-d`} rows={4} value={desarrollo} onChange={(e) => setDesarrollo(e.target.value)} />
                </div>
                {datosCambiados && (
                  <div className="onix-acciones">
                    <button className="btn-primary" disabled={ocupadoAlgo} onClick={guardarDatos}><Save size={15} /> {ocupado === 'datos' ? 'Guardando...' : 'Guardar cambios'}</button>
                    <button className="btn-secondary" onClick={() => { setTitulo(tituloDe(r)); setDesarrollo(r.desarrollo || '') }}>Deshacer</button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 2. Evidencias */}
          <section className="onix-bloque">
            <h4 className="onix-bloque-titulo"><span className="onix-paso-num">2</span> Evidencias</h4>
            {!soloLectura && <p className="onix-informe-meta">Capturas o fotos que muestren lo que hiciste. Escribe debajo qué muestra cada una: la IA lo usa para ubicarlas en el documento.</p>}
            {imagenes.length > 0 && (
              <div className="onix-galeria">
                {imagenes.map((e) => (
                  <figure key={e.id} className="onix-galeria-item">
                    <EvidenciaImagen id={e.id} alt={e.descripcion} />
                    {soloLectura
                      ? e.descripcion && <figcaption>{e.descripcion}</figcaption>
                      : <PieImagen evidencia={e} onGuardado={onCambio} />}
                    {!soloLectura && (
                      <button className="btn-icon btn-icon-delete" title="Quitar imagen" aria-label="Quitar imagen" onClick={() => quitarEvidencia(e)}><X size={13} /></button>
                    )}
                  </figure>
                ))}
              </div>
            )}
            {otras.length > 0 && (
              <ul className="onix-enlaces">
                {otras.map((e) => (
                  <li key={e.id}>
                    {e.tipo === 'link'
                      ? <a href={e.contenido} target="_blank" rel="noreferrer"><Link2 size={13} /> {e.descripcion || e.contenido}</a>
                      : <span>{e.descripcion ? `${e.descripcion}: ` : ''}{e.contenido}</span>}
                    {!soloLectura && (
                      <button className="btn-icon btn-icon-delete" title="Quitar enlace" aria-label="Quitar enlace" onClick={() => quitarEvidencia(e)}><X size={13} /></button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {soloLectura && !r.evidencias.length && <p className="onix-informe-meta">Sin evidencias.</p>}
            {!soloLectura && (
              <>
                <ImagenesDrop onArchivos={subirImagenes} disabled={subiendo} />
                {enlace === null ? (
                  <button type="button" className="onix-agregar-enlace" onClick={() => setEnlace('')}><Link2 size={14} /> Agregar un enlace (Drive, sitio web, video...)</button>
                ) : (
                  <form className="onix-enlace-form" onSubmit={guardarEnlace}>
                    <input type="url" className="filter-select" placeholder="https://..." aria-label="Enlace de evidencia" value={enlace}
                      onChange={(e) => setEnlace(e.target.value)} required autoFocus />
                    <button type="submit" className="btn-primary" disabled={subiendo}>Agregar</button>
                    <button type="button" className="btn-secondary" onClick={() => setEnlace(null)}>Cancelar</button>
                  </form>
                )}
              </>
            )}
          </section>

          {/* 3. Redactar con IA */}
          <section className="onix-bloque">
            <h4 className="onix-bloque-titulo">
              <span className="onix-paso-num">3</span> Redactar con IA
              <span className={`badge ${lista ? 'badge-synced' : 'badge-pending'}`}>{lista ? 'Redactada' : 'Sin redactar'}</span>
            </h4>
            {ocupado === 'generar' ? (
              <Redactando texto="Redactando el párrafo y el documento de evidencia..." />
            ) : r.parrafo ? (
              <>
                <textarea aria-label="Párrafo para el informe" rows={4} value={parrafo} readOnly={soloLectura} onChange={(e) => setParrafo(e.target.value)} />
                <p className="onix-informe-meta">
                  Párrafo para el informe, redactado con {r.proveedor} ({r.modelo}). {!soloLectura && 'Puedes corregirlo antes de descargar.'}
                </p>
              </>
            ) : (
              soloLectura ? <p className="onix-informe-meta">Aún no se ha redactado.</p> : (
                <div className="onix-explica">
                  Cuando tengas la descripción y las evidencias, la IA redacta por ti:
                  <ul>
                    <li><strong>El párrafo para el informe</strong> de la actividad: "Durante este periodo se…"</li>
                    <li><strong>El documento de evidencia</strong> (Word) con tus imágenes ordenadas y explicadas.</li>
                  </ul>
                  Después puedes corregir el párrafo y descargar el documento.
                </div>
              )
            )}
            <div className="onix-acciones">
              {!soloLectura && (
                <button className={r.parrafo ? 'btn-secondary' : 'btn-primary'} disabled={!perfilCompleto || ocupadoAlgo} onClick={generar}
                  title={!perfilCompleto ? 'Completa tu perfil en Configuración' : undefined}>
                  <Sparkles size={15} /> {ocupado === 'generar' ? 'Redactando... (puede tardar un minuto)' : r.parrafo ? 'Redactar de nuevo' : 'Redactar con IA'}
                </button>
              )}
              {!soloLectura && parrafoCambiado && (
                <button className="btn-secondary" disabled={ocupadoAlgo} onClick={guardarParrafo}><Save size={15} /> Guardar párrafo</button>
              )}
              {r.documento && (
                <button className="btn-primary" disabled={ocupadoAlgo} onClick={descargar}>
                  <FileDown size={15} /> {ocupado === 'word' ? 'Descargando...' : 'Descargar documento de evidencia'}
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="modal-actions onix-sub-modal-pie">
          {!soloLectura && (
            <button type="button" className="btn-secondary onix-btn-peligro" onClick={eliminar}><Trash2 size={15} /> Eliminar subactividad</button>
          )}
          <button type="button" className="btn-secondary" onClick={cerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
