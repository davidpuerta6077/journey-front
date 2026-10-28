import { useState } from 'react'
import { ChevronLeft, PenLine, History, CalendarDays, Mail, ListChecks, FileDown, CheckCircle2, Circle, Link2 } from 'lucide-react'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError } from '../../../services/alerts'
import SubactividadModal from './SubactividadModal'
import SubactividadForm from './SubactividadForm'
import EvidenciaImagen from './EvidenciaImagen'
import TraerLogsModal from './TraerLogsModal'
import TraerGoogleModal from './TraerGoogleModal'
import TraerCorreoModal from './TraerCorreoModal'
import TraerAtomModal from './TraerAtomModal'
import { generada, plural, tituloDe } from './evidencias'
import { MESES } from './periodo'

// Una actividad del contrato por dentro: de dónde agregar lo que hiciste, lo que
// ya hay con sus evidencias, y al final la IA que redacta lo pendiente.
export default function ActividadMes({
  actividad, numero, registros, periodo, onCambio, onActualizado, onVolver, onRedactar,
  perfilCompleto, soloLectura = false, bloqueado = false,
}) {
  const [abiertoId, setAbiertoId] = useState(null)
  const [nueva, setNueva] = useState(false)
  const [traerLogs, setTraerLogs] = useState(false)
  const [traerGoogle, setTraerGoogle] = useState(false)
  const [traerCorreo, setTraerCorreo] = useState(false)
  const [traerAtom, setTraerAtom] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const pendientes = registros.filter((r) => !generada(r))
  const lista = registros.length > 0 && !pendientes.length
  const abierto = registros.find((r) => r.id === abiertoId)
  const mes = MESES[periodo.mes - 1].toLowerCase()

  const fuentes = [
    { id: 'mano', Icono: PenLine, titulo: 'Escribirlo yo', texto: 'Cuenta qué hiciste y sube tus capturas', abrir: () => setNueva(true) },
    { id: 'hub', Icono: History, titulo: 'Mis acciones en Bravo Hub', texto: 'Lo que hiciste en la plataforma este mes', abrir: () => setTraerLogs(true) },
    { id: 'calendar', Icono: CalendarDays, titulo: 'Google Calendar', texto: 'Reuniones y eventos de tu calendario', abrir: () => setTraerGoogle(true) },
    { id: 'correo', Icono: Mail, titulo: 'Correos enviados', texto: 'Correos que enviaste sobre esta actividad', abrir: () => setTraerCorreo(true) },
    { id: 'atom', Icono: ListChecks, titulo: 'Tareas de Atom', texto: 'Tareas que completaste en Atom', abrir: () => setTraerAtom(true) },
  ]

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
    <div className="onix-act">
      <button type="button" className="onix-volver" onClick={onVolver}><ChevronLeft size={18} /> Mis actividades</button>

      <header className="onix-act-cabeza">
        <span className="onix-act-num" aria-hidden="true">{numero}</span>
        <div>
          <h3>{actividad.nombre}</h3>
          {actividad.descripcion && <p>{actividad.descripcion}</p>}
        </div>
      </header>

      {!soloLectura && (
        <section className="onix-seccion" aria-labelledby={`agregar-${actividad.id}`}>
          <h4 id={`agregar-${actividad.id}`}>Agrega lo que hiciste</h4>
          <p className="onix-seccion-ayuda">Escríbelo tú o tráelo de donde ya quedó registrado. Todo se guarda en esta actividad.</p>
          <div className="onix-fuentes">
            {fuentes.map(({ id, Icono, titulo, texto, abrir }) => (
              <button key={id} type="button" className="onix-fuente" onClick={abrir} disabled={bloqueado}>
                <span className="onix-fuente-icono"><Icono size={20} /></span>
                <span className="onix-fuente-texto">
                  <span className="onix-fuente-titulo">{titulo}</span>
                  <span className="onix-fuente-desc">{texto}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="onix-seccion" aria-labelledby={`hecho-${actividad.id}`}>
        <h4 id={`hecho-${actividad.id}`}>Lo que hiciste en {mes} {registros.length > 0 && <span className="onix-lista-total">{registros.length}</span>}</h4>
        {registros.length === 0 ? (
          <p className="onix-vacio-texto">
            {soloLectura ? 'Sin registros este mes.' : 'Todavía no hay nada en esta actividad. Empieza con una de las opciones de arriba.'}
          </p>
        ) : (
          <ul className="onix-cosas">
            {registros.map((r) => {
              const ok = generada(r)
              const imagenes = r.evidencias.filter((e) => e.tipo === 'imagen')
              const otras = r.evidencias.filter((e) => e.tipo !== 'imagen')
              return (
                <li key={r.id} className="onix-cosa">
                  <button type="button" className="onix-cosa-abrir" onClick={() => setAbiertoId(r.id)}>
                    <span className={`onix-cosa-estado${ok ? ' ok' : ''}`} aria-hidden="true">
                      {ok ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </span>
                    <span className="onix-cosa-info">
                      <span className="onix-cosa-titulo">{tituloDe(r)}</span>
                      <span className="onix-cosa-meta">
                        {ok ? 'Párrafo listo' : 'Falta redactar'}
                        {r.evidencias.length ? `, ${plural(r.evidencias.length, 'evidencia', 'evidencias')}` : ', sin evidencias'}
                        {r.logs > 0 && ', desde Bravo Hub'}
                      </span>
                    </span>
                    <span className="onix-cosa-ver">{soloLectura ? 'Ver' : 'Ver y editar'}</span>
                  </button>
                  {r.evidencias.length > 0 && (
                    <div className="onix-cosa-evidencias">
                      {imagenes.slice(0, 4).map((e) => (
                        <span key={e.id} className="onix-thumb"><EvidenciaImagen id={e.id} alt={e.descripcion} /></span>
                      ))}
                      {imagenes.length > 4 && <span className="onix-thumb onix-thumb-mas">+{imagenes.length - 4}</span>}
                      {otras.map((e) => (
                        e.tipo === 'link'
                          ? <a key={e.id} className="onix-enlace-chip" href={e.contenido} target="_blank" rel="noreferrer"><Link2 size={14} /> {e.descripcion || e.contenido}</a>
                          : <span key={e.id} className="onix-enlace-chip">{e.descripcion || e.contenido}</span>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {registros.length > 0 && (
        <section className="onix-redactar" aria-labelledby={`ia-${actividad.id}`}>
          <div className="onix-redactar-texto">
            <h4 id={`ia-${actividad.id}`}>{lista ? 'Esta actividad está lista' : 'Redactar con IA'}</h4>
            <p>
              {lista
                ? 'Cada cosa ya tiene su párrafo. Puedes descargar el Word de evidencias de esta actividad o volver a tus actividades.'
                : 'La IA escribe el párrafo del informe de cada cosa que hiciste, a partir de tu descripción y tus evidencias, y arma el Word de esta actividad. Después puedes revisarlo y corregirlo.'}
            </p>
          </div>
          {lista ? (
            <button className="btn-secondary" disabled={descargando || bloqueado} onClick={descargar}>
              <FileDown size={16} /> {descargando ? 'Descargando...' : 'Descargar Word'}
            </button>
          ) : !soloLectura && (
            <button className="btn-primary" disabled={bloqueado || !perfilCompleto} onClick={() => onRedactar(pendientes)}
              title={!perfilCompleto ? 'Completa tu perfil en Configuración' : undefined}>
              <PenLine size={16} /> Redactar {pendientes.length === 1 ? 'la pendiente' : `las ${pendientes.length} pendientes`}
            </button>
          )}
        </section>
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
                <span className="onix-num">{actividad.nombre}</span>
                <h3 id={`nueva-${actividad.id}`}>Agregar lo que hiciste</h3>
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
      {traerAtom && (
        <TraerAtomModal actividad={actividad} periodo={periodo} registros={registros} onClose={() => setTraerAtom(false)}
          onAgregado={() => { setTraerAtom(false); onCambio() }} />
      )}
      {traerCorreo && (
        <TraerCorreoModal actividad={actividad} periodo={periodo} registros={registros} onClose={() => setTraerCorreo(false)}
          onAgregado={() => { setTraerCorreo(false); onCambio() }} />
      )}
      {traerLogs && (
        <TraerLogsModal actividad={actividad} periodo={periodo} registros={registros} onClose={() => setTraerLogs(false)}
          onAgregado={() => { setTraerLogs(false); onCambio() }} />
      )}
    </div>
  )
}
