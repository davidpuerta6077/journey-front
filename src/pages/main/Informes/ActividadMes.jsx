import { useState } from 'react'
import { Plus, History, FileDown, ChevronRight, CheckCircle2, Image as ImageIcon, Link2, CalendarDays } from 'lucide-react'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError } from '../../../services/alerts'
import SubactividadModal from './SubactividadModal'
import SubactividadForm from './SubactividadForm'
import TraerLogsModal from './TraerLogsModal'
import TraerGoogleModal from './TraerGoogleModal'
import { generada, plural, tituloDe } from './evidencias'
import { MESES } from './periodo'

// Detalle de una actividad en el mes: sus subactividades como filas; cada una
// se abre en una ventana con todo lo suyo.
export default function ActividadMes({
  actividad, numero, registros, periodo, onCambio, onActualizado,
  perfilCompleto, soloLectura = false, bloqueado = false,
}) {
  const [abiertoId, setAbiertoId] = useState(null)
  const [nueva, setNueva] = useState(false)
  const [traerLogs, setTraerLogs] = useState(false)
  const [traerGoogle, setTraerGoogle] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const generadas = registros.filter(generada).length
  const lista = registros.length > 0 && generadas === registros.length
  const abierto = registros.find((r) => r.id === abiertoId)

  const descargar = async () => {
    setDescargando(true)
    try {
      await descargarArchivo(`/actividades/${actividad.id}/documento-word`, periodo,
        `Evidencia_${MESES[periodo.mes - 1]}_actividad_${numero}.docx`)
    } catch (e) {
      alertError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <section className="onix-card onix-panel" aria-labelledby={`act-${actividad.id}`}>
      <header className="onix-panel-head">
        <div>
          <span className="onix-num">Actividad {numero}</span>
          <h3 id={`act-${actividad.id}`}>{actividad.nombre}</h3>
          {actividad.descripcion && <p className="onix-act-desc">{actividad.descripcion}</p>}
        </div>
        <button className={lista ? 'btn-primary' : 'btn-secondary'} disabled={!lista || descargando || bloqueado} onClick={descargar}
          title={!lista ? 'Se habilita cuando todas las subactividades estén redactadas con IA' : 'Evidencia_<mes>_actividad_N.docx'}>
          <FileDown size={16} /> {descargando ? 'Descargando...' : 'Documento de la actividad'}
        </button>
      </header>

      {!soloLectura && (
        <div className="onix-acciones">
          <button className="btn-primary" onClick={() => setNueva(true)}><Plus size={16} /> Agregar subactividad</button>
          <button className="btn-secondary" onClick={() => setTraerLogs(true)}><History size={16} /> Traer de mis acciones en Bravo Hub</button>
          <button className="btn-secondary" onClick={() => setTraerGoogle(true)}><CalendarDays size={16} /> Traer de mi Google Calendar</button>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="onix-vacio">
          {soloLectura ? 'Sin subactividades este mes.' : (
            <>
              <strong>Aún no hay subactividades este mes.</strong>
              <span>Agrega cada cosa puntual que hiciste para esta actividad (ej. "Micrositio CELEP"), o tráela de tus acciones en Bravo Hub.</span>
            </>
          )}
        </div>
      ) : (
        <ul className="onix-filas" aria-label="Subactividades">
          {registros.map((r, i) => {
            const imgs = r.evidencias.filter((e) => e.tipo === 'imagen').length
            const links = r.evidencias.length - imgs
            const ok = generada(r)
            return (
              <li key={r.id}>
                <button type="button" className="onix-fila" onClick={() => setAbiertoId(r.id)}>
                  <span className={`onix-fila-estado${ok ? ' ok' : ''}`} aria-hidden="true">
                    {ok ? <CheckCircle2 size={18} /> : i + 1}
                  </span>
                  <span className="onix-fila-info">
                    <span className="onix-fila-titulo">{tituloDe(r)}</span>
                    <span className="onix-fila-meta">
                      <span><ImageIcon size={13} aria-hidden="true" /> {plural(imgs, 'imagen', 'imágenes')}</span>
                      {links > 0 && <span><Link2 size={13} aria-hidden="true" /> {plural(links, 'enlace', 'enlaces')}</span>}
                      {r.logs > 0 && <span>Desde Bravo Hub</span>}
                    </span>
                  </span>
                  <span className={`badge ${ok ? 'badge-synced' : 'badge-pending'}`}>{ok ? 'Redactada' : 'Sin redactar'}</span>
                  <ChevronRight size={18} aria-hidden="true" className="onix-fila-flecha" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {registros.length > 0 && (
        <p className="onix-informe-meta">
          {lista
            ? 'Todas redactadas: descarga el documento de la actividad o todo el mes en .zip.'
            : `${generadas} de ${plural(registros.length, 'subactividad redactada', 'subactividades redactadas')}. Abre cada una, revisa sus evidencias y pulsa "Redactar con IA".`}
        </p>
      )}

      {abierto && (
        <SubactividadModal key={abierto.id} registro={abierto} numero={registros.indexOf(abierto) + 1}
          soloLectura={soloLectura} perfilCompleto={perfilCompleto} bloqueado={bloqueado}
          onCerrar={() => setAbiertoId(null)} onCambio={onCambio} onActualizado={onActualizado} />
      )}

      {nueva && (
        <div className="modal-overlay">
          <div className="modal-box onix-sub-modal" role="dialog" aria-modal="true" aria-labelledby={`nueva-${actividad.id}`}>
            <div className="modal-header">
              <div>
                <span className="onix-num">Actividad {numero} · {actividad.nombre}</span>
                <h3 id={`nueva-${actividad.id}`}>Nueva subactividad</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setNueva(false)} aria-label="Cerrar">×</button>
            </div>
            <SubactividadForm actividadId={actividad.id} periodo={periodo}
              onGuardado={() => { setNueva(false); onCambio() }} onCancelar={() => setNueva(false)} />
          </div>
        </div>
      )}

      {traerGoogle && (
        <TraerGoogleModal actividad={actividad} periodo={periodo} registros={registros} onClose={() => setTraerGoogle(false)}
          onAgregado={() => { setTraerGoogle(false); onCambio() }} />
      )}

      {traerLogs && (
        <TraerLogsModal actividad={actividad} periodo={periodo} registros={registros} onClose={() => setTraerLogs(false)}
          onAgregado={() => { setTraerLogs(false); onCambio() }} />
      )}
    </section>
  )
}
