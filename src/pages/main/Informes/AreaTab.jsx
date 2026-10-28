import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getUsuariosArea } from '../../../services/onix/getUsuariosArea'
import { alertError } from '../../../services/alerts'
import MiMesTab from './MiMesTab'
import { plural } from './evidencias'
import { MESES, periodoActual, mover } from './periodo'

// Informes del área (o de todos, para admin): primero las personas con su avance
// del mes; al entrar a una se ve su mes en solo lectura.
export default function AreaTab({ esAdmin }) {
  const [periodo, setPeriodo] = useState(periodoActual())
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [viendo, setViendo] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setUsuarios(await getUsuariosArea(periodo))
    } catch (e) {
      alertError(e.message)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  if (viendo) {
    return (
      <div className="onix-mes">
        <button type="button" className="onix-volver onix-volver-solo" onClick={() => setViendo(null)}><ChevronLeft size={18} /> Todos los informes</button>
        <header className="onix-act-cabeza onix-persona-cabeza">
          <span className="onix-act-num" aria-hidden="true">{(viendo.nombre || '?').charAt(0).toUpperCase()}</span>
          <div>
            <h3>{viendo.nombre}</h3>
            <p>{[viendo.area_nombre, viendo.email].filter(Boolean).join(', ')}</p>
          </div>
        </header>
        <MiMesTab userId={viendo.user_id} soloLectura />
      </div>
    )
  }

  const completos = usuarios.filter((u) => u.registros > 0 && u.generados === u.registros).length

  return (
    <div className="onix-mes">
      <div className="onix-mes-cabeza">
        <div className="onix-mes-nav">
          <button className="onix-mes-flecha" aria-label="Mes anterior" title="Mes anterior" onClick={() => setPeriodo(mover(periodo, -1))}><ChevronLeft size={20} /></button>
          <h3 aria-live="polite">{MESES[periodo.mes - 1]} <span className="onix-mes-anio">{periodo.anio}</span></h3>
          <button className="onix-mes-flecha" aria-label="Mes siguiente" title="Mes siguiente" onClick={() => setPeriodo(mover(periodo, 1))}><ChevronRight size={20} /></button>
        </div>
        {!loading && usuarios.length > 0 && (
          <div className="onix-mes-resumen">
            <p>{plural(usuarios.length, 'persona', 'personas')}; {completos} con todo redactado.</p>
          </div>
        )}
      </div>

      <section className="onix-seccion" aria-labelledby="area-titulo">
        <h4 id="area-titulo">{esAdmin ? 'Informes de todos' : 'Informes de tu área'}</h4>
        <p className="onix-seccion-ayuda">Entra a una persona para ver su mes: sus actividades, lo que hizo y sus evidencias.</p>

        {loading ? (
          <div className="loading-box"><span className="loader"></span>Cargando...</div>
        ) : usuarios.length === 0 ? (
          <p className="onix-vacio-texto">
            {esAdmin ? 'Nadie ha completado su perfil de informes todavía.' : 'No hay usuarios en tu área. Si no ves a nadie, revisa que tu perfil tenga un área asignada.'}
          </p>
        ) : (
          <ol className="onix-actividades">
            {usuarios.map((u) => {
              const completo = u.registros > 0 && u.generados === u.registros
              const estado = !u.registros
                ? 'Sin registros este mes'
                : completo
                  ? `Listo: ${plural(u.registros, 'cosa redactada', 'cosas redactadas')}`
                  : `${u.generados} de ${u.registros} redactadas`
              return (
                <li key={u.user_id}>
                  <button type="button" className="onix-actividad-fila" onClick={() => setViendo(u)}>
                    <span className="onix-act-num" aria-hidden="true">{(u.nombre || '?').charAt(0).toUpperCase()}</span>
                    <span className="onix-actividad-info">
                      <span className="onix-actividad-nombre">{u.nombre}</span>
                      <span className="onix-actividad-desc">{[u.area_nombre, u.identificacion && `C.C. ${u.identificacion}`, u.email].filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="onix-actividad-avance">
                      <span className={`onix-actividad-estado${completo ? ' ok' : !u.registros ? ' vacio' : ''}`}>{estado}</span>
                      <span className="onix-barra" aria-hidden="true">
                        <span style={{ width: `${u.registros ? (u.generados / u.registros) * 100 : 0}%` }} />
                      </span>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" className="onix-fila-flecha" />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
