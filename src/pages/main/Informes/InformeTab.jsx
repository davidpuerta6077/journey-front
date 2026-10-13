import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Save, FileDown, Images } from 'lucide-react'
import { getActividades } from '../../../services/onix/getActividades'
import { getInformes } from '../../../services/onix/getInformes'
import { generarInforme } from '../../../services/onix/generarInforme'
import { updateInforme } from '../../../services/onix/updateInforme'
import { descargarInformeWord } from '../../../services/onix/descargarInformeWord'
import { descargarEvidenciasWord } from '../../../services/onix/descargarEvidenciasWord'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import { MESES, periodoActual, aniosDisponibles } from './periodo'

export default function InformeTab({ perfilCompleto = true, onIrAPerfil, userId, soloLectura = false }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [actividades, setActividades] = useState([])
  const [informes, setInformes] = useState({}) // actividad_id -> informe
  const [textos, setTextos] = useState({}) // actividad_id -> texto en edición
  const [loading, setLoading] = useState(true)
  const [ocupado, setOcupado] = useState(null) // `${accion}-${actividadId}`

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [acts, infs] = await Promise.all([
        getActividades(userId),
        getInformes({ ...periodo, ...(userId ? { user_id: userId } : {}) }),
      ])
      const porActividad = Object.fromEntries(infs.map((i) => [i.actividad_id, i]))
      setActividades(acts)
      setInformes(porActividad)
      setTextos(Object.fromEntries(infs.map((i) => [i.actividad_id, i.desarrollo])))
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [periodo, userId])

  useEffect(() => { cargar() }, [cargar])

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

  const generar = (act) => conOcupado(`generar-${act.id}`, async () => {
    const editado = informes[act.id] && textos[act.id] !== informes[act.id].desarrollo
    if (informes[act.id] && !(await confirmAccion({
      title: '¿Generar de nuevo?',
      text: editado ? 'Se reemplazará el texto, incluidos tus cambios sin guardar.' : 'Se reemplazará el texto actual.',
      confirmButtonText: 'Sí, generar',
    }))) return
    const inf = await generarInforme({ actividad_id: act.id, ...periodo })
    setInformes((p) => ({ ...p, [act.id]: inf }))
    setTextos((p) => ({ ...p, [act.id]: inf.desarrollo }))
    toastExito('Desarrollo generado')
  })

  const guardar = (act) => conOcupado(`guardar-${act.id}`, async () => {
    const inf = await updateInforme(informes[act.id].id, { desarrollo: textos[act.id] })
    setInformes((p) => ({ ...p, [act.id]: inf }))
    toastExito('Texto guardado')
  })

  const descargarInforme = (act) => conOcupado(`word-${act.id}`, async () => {
    if (!soloLectura && textos[act.id] !== informes[act.id].desarrollo) {
      const inf = await updateInforme(informes[act.id].id, { desarrollo: textos[act.id] })
      setInformes((p) => ({ ...p, [act.id]: inf }))
    }
    await descargarInformeWord(informes[act.id].id)
  })

  const descargarEvidencias = (act) => conOcupado(`ev-${act.id}`, () => descargarEvidenciasWord(act.id, periodo))

  return (
    <div>
      <div className="onix-toolbar">
        <h3>Informe de {MESES[periodo.mes - 1]} {periodo.anio}</h3>
        <div className="onix-filtros">
          <select className="filter-select" aria-label="Mes" value={periodo.mes} onChange={(e) => setPeriodo({ ...periodo, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" aria-label="Año" value={periodo.anio} onChange={(e) => setPeriodo({ ...periodo, anio: Number(e.target.value) })}>
            {aniosDisponibles().map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {!soloLectura && !perfilCompleto && (
        <p className="onix-aviso">
          Para generar informes primero completa tu perfil.{' '}
          <button className="btn-secondary" onClick={onIrAPerfil}>Ir a Mi perfil</button>
        </p>
      )}

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : actividades.length === 0 ? (
        <p className="onix-vacio">No hay actividades registradas.</p>
      ) : actividades.map((act, i) => {
        const inf = informes[act.id]
        return (
          <div key={act.id} className="onix-card onix-registro onix-informe">
            <div className="onix-registro-head">
              <div>
                <span className="onix-num">Actividad {i + 1}</span>
                <h4 style={{ margin: '2px 0 0' }}>{act.nombre}</h4>
              </div>
              <div className="onix-acciones">
                {!soloLectura && (
                  <button className="btn-primary" disabled={!perfilCompleto || ocupado !== null} onClick={() => generar(act)}>
                    <Sparkles size={15} /> {ocupado === `generar-${act.id}` ? 'Generando...' : inf ? 'Generar de nuevo' : 'Generar con IA'}
                  </button>
                )}
                <button className="btn-secondary" disabled={ocupado !== null} onClick={() => descargarEvidencias(act)}>
                  <Images size={15} /> {ocupado === `ev-${act.id}` ? 'Descargando...' : 'Evidencias (Word)'}
                </button>
              </div>
            </div>

            {inf ? (
              <>
                <textarea aria-label={`Desarrollo de ${act.nombre}`} value={textos[act.id] ?? ''} readOnly={soloLectura}
                  onChange={(e) => setTextos((p) => ({ ...p, [act.id]: e.target.value }))} />
                <div className="onix-registro-head">
                  <span className="onix-informe-meta">
                    Generado con {inf.proveedor} ({inf.modelo}){inf.editado_at ? ' · editado' : ''}
                  </span>
                  <div className="onix-acciones">
                    {!soloLectura && (
                      <button className="btn-secondary" disabled={ocupado !== null || textos[act.id] === inf.desarrollo} onClick={() => guardar(act)}>
                        <Save size={15} /> Guardar texto
                      </button>
                    )}
                    <button className="btn-primary" disabled={ocupado !== null} onClick={() => descargarInforme(act)}>
                      <FileDown size={15} /> {ocupado === `word-${act.id}` ? 'Descargando...' : 'Informe (Word)'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="onix-informe-meta">
                {soloLectura ? 'Sin informe generado este mes.' : 'Aún no se ha generado el desarrollo de este mes. Agrega registros en "Mis actividades" y luego genera con IA.'}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
