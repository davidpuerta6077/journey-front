import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, FolderDown, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { getActividades } from '../../../services/onix/getActividades'
import { getRegistros } from '../../../services/onix/getRegistros'
import { generarSubactividad } from '../../../services/onix/generarSubactividad'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import ActividadMes from './ActividadMes'
import { generada, tituloDe, plural } from './evidencias'
import { MESES, periodoActual } from './periodo'

const mover = ({ mes, anio }, d) => {
  const m = mes - 1 + d
  return { mes: ((m % 12) + 12) % 12 + 1, anio: anio + Math.floor(m / 12) }
}

// Todo el informe del mes: actividades a la izquierda y la elegida a la
// derecha. Con userId muestra el de otro usuario (área/admin) en solo lectura.
export default function MiMesTab({ perfilCompleto = true, onIrAConfig, userId, soloLectura = false }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [actividades, setActividades] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [elegida, setElegida] = useState(null)
  const [progreso, setProgreso] = useState(null) // { actual, total } mientras genera
  const [descargando, setDescargando] = useState(false)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true)
    try {
      const [acts, regs] = await Promise.all([getActividades(userId), getRegistros({ ...periodo, user_id: userId })])
      setActividades(acts)
      setRegistros(regs)
      return { acts, regs }
    } catch (e) {
      alertError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [periodo, userId])

  // Al cambiar de mes se elige la primera actividad con algo pendiente.
  useEffect(() => {
    cargar().then((r) => {
      if (!r) return
      const pendiente = (a) => {
        const regs = r.regs.filter((x) => x.actividad_id === a.id)
        return !regs.length || regs.some((x) => !generada(x))
      }
      setElegida((r.acts.find(pendiente) || r.acts[0])?.id ?? null)
    })
  }, [cargar])

  const porActividad = useMemo(() => {
    const m = {}
    registros.forEach((r) => { (m[r.actividad_id] ||= []).push(r) })
    return m
  }, [registros])

  const actualizar = (nuevo) => setRegistros((l) => l.map((r) => (r.id === nuevo.id ? { ...r, ...nuevo } : r)))

  const generadas = registros.filter(generada).length
  const pendientes = registros.filter((r) => !generada(r))
  const todoListo = registros.length > 0 && !pendientes.length
  const esActual = periodo.mes === periodoActual().mes && periodo.anio === periodoActual().anio

  // Genera en orden las pendientes; si todas están generadas pregunta antes de regenerar.
  const generarMes = async () => {
    let objetivo = pendientes
    if (!objetivo.length) {
      if (!(await confirmAccion({
        title: '¿Redactar todo de nuevo?',
        text: 'Todas las subactividades ya están redactadas. Se reemplazarán sus párrafos y documentos de evidencia.',
        confirmButtonText: 'Sí, redactar',
      }))) return
      objetivo = registros
    }
    const fallos = []
    for (let i = 0; i < objetivo.length; i++) {
      setProgreso({ actual: i + 1, total: objetivo.length })
      try {
        actualizar(await generarSubactividad(objetivo[i].id))
      } catch (e) {
        fallos.push(`"${tituloDe(objetivo[i])}": ${e.message}`)
      }
    }
    setProgreso(null)
    if (fallos.length) alertError(`${objetivo.length - fallos.length} redactada(s), ${fallos.length} con error. ${fallos.join('. ')}`)
    else toastExito(`${plural(objetivo.length, 'subactividad redactada', 'subactividades redactadas')}`)
  }

  const descargarZip = async () => {
    setDescargando(true)
    try {
      await descargarArchivo('/zip', { ...periodo, user_id: userId }, `Informe_${MESES[periodo.mes - 1]}_${periodo.anio}.zip`)
    } catch (e) {
      alertError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  const ocupado = progreso !== null || descargando
  const actividad = actividades.find((a) => a.id === elegida)

  // Qué sigue, en una línea.
  const siguiente = !registros.length
    ? 'Elige una actividad y agrega lo que hiciste este mes (subactividades con sus evidencias).'
    : !todoListo
      ? `Falta redactar ${plural(pendientes.length, 'subactividad', 'subactividades')}: la IA escribe el párrafo del informe y el documento Word de evidencia. Hazlo una por una o todas con "Redactar pendientes".`
      : 'Todo listo. Descarga el .zip (una carpeta por actividad) y súbelo a Drive.'

  return (
    <div>
      <div className="onix-mes-barra">
        <div className="onix-mes-nav">
          <button className="btn-icon" aria-label="Mes anterior" title="Mes anterior" onClick={() => setPeriodo(mover(periodo, -1))}><ChevronLeft size={18} /></button>
          <h3 aria-live="polite">{MESES[periodo.mes - 1]} {periodo.anio}</h3>
          <button className="btn-icon" aria-label="Mes siguiente" title="Mes siguiente" onClick={() => setPeriodo(mover(periodo, 1))}><ChevronRight size={18} /></button>
          {!esActual && <button className="onix-agregar-enlace" onClick={() => setPeriodo(periodoActual())}>Ir al mes actual</button>}
        </div>
        <div className="onix-filtros">
          {!soloLectura && (
            <button className={todoListo ? 'btn-secondary' : 'btn-primary'} disabled={!perfilCompleto || !registros.length || ocupado} onClick={generarMes}
              title={!registros.length ? 'Agrega subactividades primero' : undefined}>
              <Sparkles size={16} /> {progreso ? `Redactando ${progreso.actual} de ${progreso.total}...` : todoListo ? 'Redactar todo de nuevo' : `Redactar pendientes con IA${pendientes.length ? ` (${pendientes.length})` : ''}`}
            </button>
          )}
          <button className={todoListo ? 'btn-primary' : 'btn-secondary'} disabled={!todoListo || ocupado} onClick={descargarZip}
            title={!todoListo ? 'Se habilita cuando todas las subactividades estén redactadas con IA' : 'Carpetas por actividad, como en Drive'}>
            <FolderDown size={16} /> {descargando ? 'Descargando...' : 'Descargar todo (.zip)'}
          </button>
        </div>
      </div>

      {!loading && actividades.length > 0 && (
        <div className="onix-progreso">
          <div className="onix-progreso-texto">
            <strong>{generadas} de {plural(registros.length, 'subactividad redactada', 'subactividades redactadas')}</strong>
            {!soloLectura && <span>{siguiente}</span>}
          </div>
          <div className="onix-progreso-barra" role="progressbar" aria-valuemin={0} aria-valuemax={registros.length || 1} aria-valuenow={generadas}
            aria-label="Subactividades redactadas">
            <span style={{ width: `${registros.length ? (generadas / registros.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

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
      ) : (
        <div className="onix-mes-layout">
          <nav className="onix-act-lista" aria-label="Actividades del contrato">
            {actividades.map((a, i) => {
              const regs = porActividad[a.id] || []
              const listas = regs.filter(generada).length
              const ok = regs.length > 0 && listas === regs.length
              return (
                <button key={a.id} type="button" className={`onix-act-item${a.id === elegida ? ' activa' : ''}`}
                  aria-current={a.id === elegida ? 'true' : undefined} onClick={() => setElegida(a.id)}>
                  <span className={`onix-fila-estado${ok ? ' ok' : ''}`} aria-hidden="true">{ok ? <CheckCircle2 size={18} /> : i + 1}</span>
                  <span className="onix-fila-info">
                    <span className="onix-fila-titulo">{a.nombre}</span>
                    <span className="onix-fila-meta">
                      {regs.length ? `${listas} de ${plural(regs.length, 'redactada', 'redactadas')}` : 'Sin subactividades'}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
          {actividad && (
            <ActividadMes key={`${actividad.id}-${periodo.mes}-${periodo.anio}`} actividad={actividad}
              numero={actividades.indexOf(actividad) + 1} periodo={periodo}
              registros={porActividad[actividad.id] || []}
              onCambio={() => cargar({ silencioso: true })} onActualizado={actualizar}
              perfilCompleto={perfilCompleto} soloLectura={soloLectura} bloqueado={progreso !== null} />
          )}
        </div>
      )}
    </div>
  )
}
