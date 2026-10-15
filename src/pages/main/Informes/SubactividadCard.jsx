import { useState } from 'react'
import { Pencil, Trash2, X, Link2, Sparkles, Save, FileDown } from 'lucide-react'
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
import { tituloDe } from './evidencias'

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

export default function SubactividadCard({ registro: r, soloLectura = false, perfilCompleto = true, bloqueado = false, onEditar, onCambio, onActualizado }) {
  const [subiendo, setSubiendo] = useState(false)
  const [enlace, setEnlace] = useState(null) // null = formulario oculto
  const [parrafo, setParrafo] = useState(r.parrafo || '')
  const [ocupado, setOcupado] = useState(null)
  const [parrafoBase, setParrafoBase] = useState(r.parrafo)

  // Al regenerar o recargar, el texto en edición toma el párrafo nuevo.
  if (parrafoBase !== r.parrafo) {
    setParrafoBase(r.parrafo)
    setParrafo(r.parrafo || '')
  }

  const cambiado = !!r.parrafo && parrafo !== r.parrafo
  const ocupadoAlgo = ocupado !== null || bloqueado

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
      onCambio()
    } catch (e) {
      alertError(e.message)
    }
  }

  const generar = () => conOcupado('generar', async () => {
    if (r.parrafo && !(await confirmAccion({
      title: '¿Generar de nuevo?',
      text: cambiado
        ? 'Se reemplazarán el párrafo (incluidos tus cambios sin guardar) y el documento de evidencia.'
        : 'Se reemplazarán el párrafo y el documento de evidencia.',
      confirmButtonText: 'Sí, generar',
    }))) return
    onActualizado(await generarSubactividad(r.id))
    toastExito('Subactividad generada')
  })

  const guardarParrafo = () => conOcupado('guardar', async () => {
    const actualizado = await updateRegistro(r.id, { desarrollo: r.desarrollo, parrafo })
    onActualizado({ ...r, ...actualizado })
    toastExito('Párrafo guardado')
  })

  const descargar = () => conOcupado('word', async () => {
    if (cambiado) onActualizado({ ...r, ...(await updateRegistro(r.id, { desarrollo: r.desarrollo, parrafo })) })
    await descargarArchivo(`/registros/${r.id}/word`, undefined, `${tituloDe(r)}.docx`)
  })

  return (
    <div className="onix-card onix-sub-card">
      <div className="onix-registro-head">
        <div>
          {r.logs > 0 && <span className="badge badge-synced onix-badge-hub">Desde Bravo Hub · {r.logs} acción(es)</span>}
          <h5 className="onix-sub-titulo">{tituloDe(r)}</h5>
          <p className="onix-registro-texto">{r.desarrollo}</p>
        </div>
        {!soloLectura && (
          <div className="action-btns">
            <button className="btn-icon btn-icon-edit" title="Editar subactividad" aria-label={`Editar ${tituloDe(r)}`} onClick={onEditar}><Pencil size={15} /></button>
            <button className="btn-icon btn-icon-delete" title="Eliminar subactividad" aria-label={`Eliminar ${tituloDe(r)}`} onClick={eliminar}><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      {r.evidencias.length > 0 && (
        <div className="onix-evidencias">
          {r.evidencias.map((e) => (
            <div key={e.id} className={`onix-evidencia${e.tipo === 'imagen' ? ' onix-evidencia-img' : ''}`}>
              {e.tipo === 'imagen' && <EvidenciaImagen id={e.id} alt={e.descripcion} />}
              {e.tipo === 'imagen' && (soloLectura
                ? e.descripcion && <span>{e.descripcion}</span>
                : <PieImagen evidencia={e} onGuardado={onCambio} />)}
              {e.tipo === 'link' && <a href={e.contenido} target="_blank" rel="noreferrer"><Link2 size={13} /> {e.descripcion || e.contenido}</a>}
              {e.tipo === 'texto' && <span>{e.descripcion ? `${e.descripcion}: ` : ''}{e.contenido}</span>}
              {!soloLectura && (
                <button className="btn-icon btn-icon-delete" title="Quitar evidencia" aria-label="Quitar evidencia" onClick={() => quitarEvidencia(e)}><X size={13} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {!soloLectura && (
        <>
          <ImagenesDrop onArchivos={subirImagenes} disabled={subiendo} />
          {enlace === null ? (
            <button type="button" className="onix-agregar-enlace" onClick={() => setEnlace('')}><Link2 size={14} /> Agregar enlace</button>
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

      <div className="onix-ia">
        <div className="onix-registro-head">
          <span className="onix-num">Para el informe</span>
          <span className="onix-informe-meta">{r.generado_at ? `Generado con ${r.proveedor} (${r.modelo})` : 'Sin generar'}</span>
        </div>
        {r.parrafo ? (
          <textarea aria-label={`Párrafo de ${tituloDe(r)}`} value={parrafo} readOnly={soloLectura} onChange={(e) => setParrafo(e.target.value)} />
        ) : (
          <p className="onix-informe-meta">
            {soloLectura ? 'Aún no se ha generado.' : 'Cuando tengas tus notas y evidencias, genera con IA el párrafo para el informe y el documento de evidencia.'}
          </p>
        )}
        <div className="onix-acciones">
          {!soloLectura && (
            <button className="btn-primary" disabled={!perfilCompleto || ocupadoAlgo} onClick={generar}>
              <Sparkles size={15} /> {ocupado === 'generar' ? 'Generando...' : r.parrafo ? 'Generar de nuevo' : 'Generar con IA'}
            </button>
          )}
          {!soloLectura && cambiado && (
            <button className="btn-secondary" disabled={ocupadoAlgo} onClick={guardarParrafo}><Save size={15} /> Guardar párrafo</button>
          )}
          <button className="btn-secondary" disabled={!r.documento || ocupadoAlgo} onClick={descargar}
            title={!r.documento ? 'Genera primero con IA' : undefined}>
            <FileDown size={15} /> {ocupado === 'word' ? 'Descargando...' : 'Documento de evidencia (Word)'}
          </button>
        </div>
      </div>
    </div>
  )
}
