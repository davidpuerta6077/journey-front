import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { listarSolicitudesTutor } from '../../../services/asignia/listarSolicitudesTutor'
import { matricularSolicitudTutor } from '../../../services/asignia/matricularSolicitudTutor'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'

const ESTADO = {
  pendiente: { label: 'Pendiente', clase: 'badge-novedad' },
  matriculado: { label: 'Matriculado', clase: 'badge-synced' },
}
const fecha = (v) => (v ? new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—')

// RF-07: solicitudes de matrícula al curso Tutor Virtual de profesores sin el certificado.
// "Marcar matriculado" solo cambia el estado aquí; la matrícula en Moodle la hace el administrador.
export default function SolicitudesTutor({ puedeDecidir }) {
  const [lista, setLista] = useState(null)
  const cargar = useCallback(() => listarSolicitudesTutor().then(setLista).catch((e) => { setLista([]); alertError(e.message) }), [])
  useEffect(() => { cargar() }, [cargar])

  const matricular = async (s) => {
    const ok = await confirmAccion({
      title: '¿Marcar como matriculado?',
      text: `${s.nombre} (${s.documento}) quedará como matriculado en Tutor Virtual. Hazlo cuando ya esté matriculado en el curso en Moodle.`,
      icon: 'question',
      confirmButtonText: 'Sí, matriculado',
    })
    if (!ok) return
    try {
      await matricularSolicitudTutor(s.id)
      toastExito('Solicitud actualizada')
      cargar()
    } catch (e) { alertError(e.message) }
  }

  if (lista === null) return <div className="loading-box"><span className="loader"></span>Cargando solicitudes...</div>
  const pendientes = lista.filter(s => s.estado === 'pendiente').length

  return (
    <>
      <p className="asignia-ayuda asignia-barra">
        Profesores sin el certificado Tutor Virtual que pidieron matrícula al curso desde su pantalla. {pendientes} pendiente{pendientes !== 1 ? 's' : ''}.
      </p>
      <div className="table-wrapper">
        <table className="data-table asignia-tabla">
          <thead>
            <tr><th>Profesor</th><th>Documento</th><th>Correo institucional</th><th>Solicitada</th><th>Estado</th>{puedeDecidir && <th>Acciones</th>}</tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={puedeDecidir ? 6 : 5} className="asignia-sin-filas">No hay solicitudes de matrícula a Tutor Virtual.</td></tr>
            ) : lista.map(s => (
              <tr key={s.id}>
                <td data-label="Profesor">{s.nombre}</td>
                <td data-label="Documento">{s.documento}</td>
                <td data-label="Correo institucional">{s.correo}</td>
                <td data-label="Solicitada">{fecha(s.created_at)}</td>
                <td data-label="Estado">
                  <div className="asignia-celda">
                    <span className={`badge asignia-badge ${ESTADO[s.estado]?.clase || ''}`}>{ESTADO[s.estado]?.label || s.estado}</span>
                    {s.matriculado_at && <span className="asignia-dato">{fecha(s.matriculado_at)}{s.matriculado_por ? ` · ${s.matriculado_por}` : ''}</span>}
                  </div>
                </td>
                {puedeDecidir && (
                  <td data-label="Acciones">
                    {s.estado === 'pendiente'
                      ? <button className="btn-secondary asignia-btn-fila" onClick={() => matricular(s)}><CheckCircle2 size={15} /> Marcar matriculado</button>
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
