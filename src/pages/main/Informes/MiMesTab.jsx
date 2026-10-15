import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, FolderDown } from 'lucide-react'
import { getActividades } from '../../../services/onix/getActividades'
import { getRegistros } from '../../../services/onix/getRegistros'
import { generarSubactividad } from '../../../services/onix/generarSubactividad'
import { descargarArchivo } from '../../../services/onix/descargarArchivo'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import ActividadMes from './ActividadMes'
import { generada, tituloDe } from './evidencias'
import { MESES, periodoActual, aniosDisponibles } from './periodo'

// Todo el informe del mes en una pantalla. Con userId muestra el de otro
// usuario (área/admin) en solo lectura.
export default function MiMesTab({ perfilCompleto = true, onIrAConfig, userId, soloLectura = false }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [actividades, setActividades] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierta, setAbierta] = useState(null)
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

  // Al cambiar de mes se abre la primera actividad con algo pendiente.
  useEffect(() => {
    cargar().then((r) => {
      if (!r) return
      const pendiente = (a) => r.regs.filter((x) => x.actividad_id === a.id).some((x) => !generada(x))
      setAbierta((r.acts.find(pendiente) || r.acts[0])?.id ?? null)
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

  // Genera en orden las pendientes; si todas están generadas pregunta antes de regenerar.
  const generarMes = async () => {
    let objetivo = pendientes
    if (!objetivo.length) {
      if (!(await confirmAccion({
        title: '¿Regenerar todo el mes?',
        text: 'Todas las subactividades ya están generadas. Se reemplazarán sus párrafos y documentos de evidencia.',
        confirmButtonText: 'Sí, regenerar',
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
    if (fallos.length) alertError(`${objetivo.length - fallos.length} generada(s), ${fallos.length} con error. ${fallos.join('. ')}`)
    else toastExito(`${objetivo.length} subactividad(es) generada(s)`)
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

  return (
    <div>
      <div className="onix-toolbar">
        <div>
          <h3>{soloLectura ? 'Informe' : 'Mi informe'} de {MESES[periodo.mes - 1]} {periodo.anio}</h3>
          {!loading && actividades.length > 0 && (
            <p className="onix-sub">{registros.length} subactividad(es) · {generadas} generada(s) con IA</p>
          )}
        </div>
        <div className="onix-filtros">
          <select className="filter-select" aria-label="Mes" value={periodo.mes} onChange={(e) => setPeriodo({ ...periodo, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" aria-label="Año" value={periodo.anio} onChange={(e) => setPeriodo({ ...periodo, anio: Number(e.target.value) })}>
            {aniosDisponibles().map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {!soloLectura && (
            <button className="btn-primary" disabled={!perfilCompleto || !registros.length || ocupado} onClick={generarMes}
              title={!registros.length ? 'Agrega subactividades primero' : undefined}>
              <Sparkles size={16} /> {progreso ? `Generando ${progreso.actual} de ${progreso.total}...` : registros.length && !pendientes.length ? 'Regenerar todo' : `Generar pendientes${pendientes.length ? ` (${pendientes.length})` : ''}`}
            </button>
          )}
          <button className="btn-secondary" disabled={!registros.length || pendientes.length > 0 || ocupado} onClick={descargarZip}
            title={pendientes.length ? 'Todas las subactividades deben estar generadas con IA' : 'Carpetas por actividad, como en Drive'}>
            <FolderDown size={16} /> {descargando ? 'Descargando...' : 'Descargar todo (.zip)'}
          </button>
        </div>
      </div>

      {!soloLectura && !perfilCompleto && (
        <p className="onix-aviso">
          Para generar con IA primero completa tu perfil.{' '}
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
      ) : actividades.map((act, i) => (
        <ActividadMes key={act.id} actividad={act} numero={i + 1} periodo={periodo}
          registros={porActividad[act.id] || []}
          abierta={abierta === act.id} onToggle={() => setAbierta(abierta === act.id ? null : act.id)}
          onCambio={() => cargar({ silencioso: true })} onActualizado={actualizar}
          perfilCompleto={perfilCompleto} soloLectura={soloLectura} bloqueado={progreso !== null} />
      ))}
    </div>
  )
}
