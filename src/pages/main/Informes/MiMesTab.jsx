import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FolderDown } from 'lucide-react'
import { getActividades } from '../../../services/onix/getActividades'
import { getRegistros } from '../../../services/onix/getRegistros'
import { generarSubactividad } from '../../../services/onix/generarSubactividad'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError, toastExito } from '../../../services/alerts'
import ActividadMes from './ActividadMes'
import MesActividades from './MesActividades'
import Redactando from './Redactando'
import { generada, tituloDe, plural } from './evidencias'
import { MESES, periodoActual, mover } from './periodo'

// El informe del mes: primero las actividades del contrato y, al entrar a una,
// de dónde agregar lo que hiciste, sus evidencias y la IA que lo redacta.
// Con userId muestra el de otro usuario (área/admin) en solo lectura.
export default function MiMesTab({ perfilCompleto = true, onIrAConfig, userId, soloLectura = false }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [actividades, setActividades] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierta, setAbierta] = useState(null) // id de la actividad en la que se entró
  const [progreso, setProgreso] = useState(null) // { actual, total, titulo } mientras la IA redacta
  const [descargando, setDescargando] = useState(false)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true)
    try {
      const [acts, regs] = await Promise.all([getActividades(userId), getRegistros({ ...periodo, user_id: userId })])
      setActividades(acts)
      setRegistros(regs)
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [periodo, userId])

  useEffect(() => { cargar() }, [cargar])

  const porActividad = useMemo(() => {
    const m = {}
    registros.forEach((r) => { (m[r.actividad_id] ||= []).push(r) })
    return m
  }, [registros])

  const actualizar = (nuevo) => setRegistros((l) => l.map((r) => (r.id === nuevo.id ? { ...r, ...nuevo } : r)))

  const generadas = registros.filter(generada).length
  const pendientes = registros.length - generadas
  const todoListo = registros.length > 0 && !pendientes
  const esActual = periodo.mes === periodoActual().mes && periodo.anio === periodoActual().anio
  const mesNombre = MESES[periodo.mes - 1]

  // Redacta en orden las subactividades indicadas (las pendientes de una actividad).
  const redactar = async (objetivo) => {
    const fallos = []
    for (let i = 0; i < objetivo.length; i++) {
      setProgreso({ actual: i + 1, total: objetivo.length, titulo: tituloDe(objetivo[i]) })
      try {
        actualizar(await generarSubactividad(objetivo[i].id))
      } catch (e) {
        fallos.push(`"${tituloDe(objetivo[i])}": ${e.message}`)
      }
    }
    setProgreso(null)
    if (fallos.length) alertError(`${objetivo.length - fallos.length} redactada(s), ${fallos.length} con error. ${fallos.join('. ')}`)
    else toastExito(plural(objetivo.length, 'cosa redactada', 'cosas redactadas'))
  }

  const descargarZip = async () => {
    setDescargando(true)
    try {
      await descargarArchivo('/zip', { ...periodo, user_id: userId }, `Informe_${mesNombre}_${periodo.anio}.zip`)
    } catch (e) {
      alertError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  const ocupado = progreso !== null || descargando
  const actividad = actividades.find((a) => a.id === abierta)

  const resumen = !registros.length
    ? `Aún no registras nada de ${mesNombre.toLowerCase()}. Entra a una actividad para empezar.`
    : todoListo
      ? 'Todo está redactado. Descarga el informe: trae una carpeta por actividad para subir a Drive.'
      : `${generadas} de ${registros.length} cosas redactadas. Faltan ${pendientes}.`

  return (
    <div className="onix-mes">
      <div className="onix-mes-cabeza">
        <div className="onix-mes-nav">
          <button className="onix-mes-flecha" aria-label="Mes anterior" title="Mes anterior" onClick={() => setPeriodo(mover(periodo, -1))}><ChevronLeft size={20} /></button>
          <h3 aria-live="polite">{mesNombre} <span className="onix-mes-anio">{periodo.anio}</span></h3>
          <button className="onix-mes-flecha" aria-label="Mes siguiente" title="Mes siguiente" onClick={() => setPeriodo(mover(periodo, 1))}><ChevronRight size={20} /></button>
          {!esActual && <button className="onix-texto-btn" onClick={() => setPeriodo(periodoActual())}>Ir al mes actual</button>}
        </div>
        {!loading && actividades.length > 0 && (
          <div className="onix-mes-resumen">
            <p>{resumen}</p>
            {todoListo && (
              <button className="btn-primary" disabled={ocupado} onClick={descargarZip}>
                <FolderDown size={16} /> {descargando ? 'Descargando...' : 'Descargar informe del mes'}
              </button>
            )}
          </div>
        )}
      </div>

      {progreso && <Redactando key={progreso.actual} texto={`Redactando ${progreso.actual} de ${progreso.total}: "${progreso.titulo}"`} />}

      {!soloLectura && !perfilCompleto && (
        <p className="onix-aviso">
          Para redactar con IA primero completa tu perfil (sus datos van en el Word).{' '}
          <button className="btn-secondary" onClick={onIrAConfig}>Ir a Configuración</button>
        </p>
      )}

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : actividades.length === 0 ? (
        soloLectura ? <p className="onix-vacio">Este usuario no tiene actividades registradas.</p> : (
          <p className="onix-aviso">
            Aún no tienes las actividades de tu contrato. Créalas una vez en Configuración y luego registra aquí cada mes lo que haces.{' '}
            <button className="btn-secondary" onClick={onIrAConfig}>Ir a Configuración</button>
          </p>
        )
      ) : actividad ? (
        <ActividadMes key={`${actividad.id}-${periodo.mes}-${periodo.anio}`} actividad={actividad}
          numero={actividades.indexOf(actividad) + 1} periodo={periodo}
          registros={porActividad[actividad.id] || []}
          onCambio={() => cargar({ silencioso: true })} onActualizado={actualizar}
          onVolver={() => setAbierta(null)} onRedactar={redactar}
          perfilCompleto={perfilCompleto} soloLectura={soloLectura} bloqueado={ocupado} />
      ) : (
        <section className="onix-seccion" aria-labelledby="onix-actividades-titulo">
          <h4 id="onix-actividades-titulo">{soloLectura ? 'Actividades del contrato' : 'Actividades de tu contrato'}</h4>
          <p className="onix-seccion-ayuda">{soloLectura ? 'Entra a cada una para ver lo que hizo este mes y sus evidencias.' : 'Entra a cada una para agregar lo que hiciste este mes y sus evidencias.'}</p>
          <MesActividades actividades={actividades} porActividad={porActividad} onAbrir={setAbierta} />
        </section>
      )}
    </div>
  )
}
