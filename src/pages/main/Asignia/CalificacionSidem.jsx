import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardCheck } from 'lucide-react'
import { calificacionProfesor } from '../../../services/asignia/calificacionProfesor'
import { miCalificacion } from '../../../services/asignia/miCalificacion'

// Calificación de seguimiento de cursos (SIDEM), de 0 a 100, del periodo mostrado.
const fmt = (v) => (v == null ? '—' : Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 }))
// Mismo color de los contadores de estado: verde (≥ 80), ámbar (≥ 60), rojo (< 60).
const tono = (v) => (v == null ? 'asignia-estado-disponible' : v >= 80 ? 'asignia-estado-aceptado' : v >= 60 ? 'asignia-estado-responder' : 'asignia-estado-rechazado')

function Barra({ valor }) {
  return (
    <span className="asignia-nota-barra" role="img" aria-label={`${fmt(valor)} de 100`}>
      <span className="asignia-nota-relleno" style={{ width: `${Math.max(0, Math.min(100, valor || 0))}%` }} />
    </span>
  )
}

// Un bloque por periodo (desde 2026-2), el más reciente primero: arriba la calificación
// global (promedio que calcula VISOR) y abajo la de cada curso.
function Detalle({ data }) {
  if (!data) return <div className="loading-box"><span className="loader"></span>Consultando seguimiento...</div>
  if (!data.periodos?.length) return <p className="asignia-ayuda">VISOR no respondió. Intenta más tarde.</p>
  return (
    <div className="asignia-notas">
      {data.periodos.map(p => (
        <section key={p.periodo} className="asignia-nota-periodo" aria-label={`Periodo ${p.periodo}`}>
          <div className="asignia-nota-cab">
            <div>
              <span className="asignia-nota-etq">Periodo</span>
              <h5 className="asignia-nota-periodo-titulo">{p.periodo}</h5>
            </div>
            <div className={`asignia-nota-global ${tono(p.disponible ? p.general : null)}`}>
              <span className="asignia-nota-etq">Seguimiento global</span>
              {!p.disponible ? <span className="asignia-nota-sub">VISOR no respondió</span>
                : p.general == null ? <span className="asignia-nota-sub">Sin cursos con seguimiento</span> : (
                  <>
                    <span className="asignia-nota-num">{fmt(p.general)}<small>/100</small></span>
                    <span className="asignia-nota-sub">Promedio de {p.cursos.length} curso{p.cursos.length !== 1 ? 's' : ''}</span>
                  </>
                )}
            </div>
          </div>
          {p.cursos.length > 0 && (
            <div className="table-wrapper">
              <table className="data-table asignia-tabla asignia-nota-tabla" aria-label={`Seguimiento por curso ${p.periodo}`}>
                <thead><tr><th>Curso</th><th>Grupo</th><th>Seguimiento del curso</th></tr></thead>
                <tbody>
                  {p.cursos.map((c, i) => (
                    <tr key={i}>
                      <td data-label="Curso">{c.nombre_curso || '—'}</td>
                      <td data-label="Grupo">{c.grupo || '—'}</td>
                      <td data-label="Seguimiento del curso">
                        <span className="asignia-nota-celda"><strong>{fmt(c.calificacion)}</strong><Barra valor={c.calificacion} /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <p className="asignia-dato">Escala de 0 a 100. El seguimiento global es el promedio del seguimiento de los cursos del periodo. En virtualidad las revisiones que faltan del semestre aún no suman; un curso sin revisiones cuenta como 0.</p>
    </div>
  )
}

function CalificacionModal({ profesor, periodo, onClose }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    calificacionProfesor(profesor.documento, periodo)
      .then(setData)
      .catch(() => setData({ periodos: [] }))
  }, [profesor.documento, periodo])
  // Portal al body: dentro de la celda de la tabla heredaba text-align y white-space y el texto se montaba.
  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-cal-titulo">
        <div className="modal-header">
          <h3 id="asignia-cal-titulo">Seguimiento VISOR · {profesor.nombre}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form"><Detalle data={data} /></div>
        <div className="modal-actions"><button className="btn-secondary" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>,
    document.body,
  )
}

// Botón "Ver" que abre las calificaciones VISOR del profesor por periodo.
// Con `icono`, solo el ícono con su tooltip (tabla de profesores del líder).
export function VerCalificacion({ profesor, periodo, icono }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      {icono ? (
        <button type="button" className="btn-icon asignia-accion asignia-tip" onClick={() => setAbierto(true)}
          data-tip="Ver seguimiento VISOR" aria-label={`Ver seguimiento VISOR de ${profesor.nombre} por periodo`}><ClipboardCheck size={15} /></button>
      ) : (
        <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => setAbierto(true)}
          aria-label={`Ver seguimiento VISOR de ${profesor.nombre} por periodo`}><ClipboardCheck size={15} /> Ver seguimiento</button>
      )}
      {abierto && <CalificacionModal profesor={profesor} periodo={periodo} onClose={() => setAbierto(false)} />}
    </>
  )
}

// Pantalla pública: la calificación del propio profesor en el periodo actual.
export function MiCalificacion({ ident }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    miCalificacion(ident).then(setData).catch(() => setData({ periodos: [] }))
  }, [ident])
  return (
    <section className="asignia-mi-nota" aria-labelledby="asignia-mi-nota-titulo">
      <h3 id="asignia-mi-nota-titulo" className="asignia-mi-nota-titulo">Mi seguimiento VISOR</h3>
      <Detalle data={data} />
    </section>
  )
}
