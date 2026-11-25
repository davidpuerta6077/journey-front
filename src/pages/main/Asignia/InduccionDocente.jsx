import { useState, useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import { induccionProfesor } from '../../../services/asignia/induccionProfesor'

// Inducción docente Ser+ Digital: el profesor está certificado si Moodle le emitió el
// certificado "Ser+ Digital Docente" de algún curso de la categoría de inducción.
const fecha = (ms) => new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

function Detalle({ data }) {
  if (!data) return <div className="loading-box"><span className="loader"></span>Consultando Moodle...</div>
  if (!data.disponible) return <p className="asignia-ayuda">Moodle no respondió. Intenta más tarde.</p>
  if (!data.encontrado) return <p className="asignia-ayuda">El profesor no tiene cuenta en Moodle con ese correo o documento.</p>
  return (
    <div className="asignia-notas">
      <div className={`asignia-nota-global ${data.certificado ? 'asignia-estado-aceptado' : 'asignia-estado-rechazado'}`}>
        <span className="asignia-nota-etq">Certificado docente</span>
        <span className="asignia-nota-num">{data.certificado ? 'Certificado' : 'Sin certificar'}</span>
        <span className="asignia-nota-sub">
          {data.certificado ? `Desde el ${fecha(data.fecha)}` : 'No tiene el certificado Ser+ Digital Docente'}
        </span>
      </div>
      {data.certificados.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table asignia-tabla" aria-label="Certificados docentes">
            <thead><tr><th>Curso</th><th>Fecha</th><th>Código</th></tr></thead>
            <tbody>
              {data.certificados.map((c) => (
                <tr key={c.codigo}>
                  <td data-label="Curso">{c.curso}</td>
                  <td data-label="Fecha">{fecha(c.fecha)}</td>
                  <td data-label="Código">{c.codigo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InduccionModal({ profesor, onClose }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    induccionProfesor(profesor.documento, profesor.correo)
      .then(setData)
      .catch(() => setData({ disponible: false }))
  }, [profesor.documento, profesor.correo])
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-ind-titulo">
        <div className="modal-header">
          <h3 id="asignia-ind-titulo">Certificado docente · {profesor.nombre}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form"><Detalle data={data} /></div>
        <div className="modal-actions"><button className="btn-secondary" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  )
}

// Botón que abre la certificación de inducción docente del profesor.
// Con `icono`, solo el ícono con su tooltip (tabla de profesores del líder).
export function VerInduccion({ profesor, icono }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      {icono ? (
        <button type="button" className="btn-icon asignia-accion asignia-tip" onClick={() => setAbierto(true)}
          data-tip="Ver certificado Tutor Virtual" aria-label={`Ver certificado docente de ${profesor.nombre}`}><GraduationCap size={15} /></button>
      ) : (
        <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => setAbierto(true)}
          aria-label={`Ver certificado docente de ${profesor.nombre}`}><GraduationCap size={15} /> Ver certificado</button>
      )}
      {abierto && <InduccionModal profesor={profesor} onClose={() => setAbierto(false)} />}
    </>
  )
}
