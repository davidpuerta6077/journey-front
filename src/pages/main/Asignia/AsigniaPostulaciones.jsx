import { Fragment, useState, useEffect, useMemo } from 'react'
import { Search, CheckCircle2, XCircle, X } from 'lucide-react'
import { listarPostulacionesPeriodo } from '../../../services/asignia/listarPostulacionesPeriodo'
import { aprobarPostulacion } from '../../../services/asignia/aprobarPostulacion'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import RechazoPostulacion from './RechazoPostulacion'
import { ESTADO_POST, horarioTexto } from './asigniaUtil'

const FILTROS_ESTADO = [
  { v: '', label: 'Todas' },
  { v: 'pendiente', label: 'En revisión', clase: ESTADO_POST.pendiente.tarjeta },
  { v: 'aprobada', label: 'Aprobadas', clase: ESTADO_POST.aprobada.tarjeta },
  { v: 'rechazada', label: 'Rechazadas', clase: ESTADO_POST.rechazada.tarjeta },
  { v: 'descartada', label: 'No seleccionadas', clase: ESTADO_POST.descartada.tarjeta },
]
const ABIERTO = ['vacio', 'postulado']

// Pestaña "Postulaciones": todas las postulaciones del periodo en un solo lugar,
// con filtros y (con permiso) asignar o rechazar con causal sin ir curso por curso.
export default function AsigniaPostulaciones({ periodo, puedeDecidir, onCambio }) {
  const [ver, setVer] = useState(0)
  const [resp, setResp] = useState({ clave: null, data: null })
  const clave = `${periodo}#${ver}`
  const [estado, setEstado] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [programa, setPrograma] = useState('')
  const [rechazoId, setRechazoId] = useState(null)

  useEffect(() => {
    listarPostulacionesPeriodo(periodo)
      .then(data => setResp({ clave, data }))
      .catch(e => { alertError(e.message); setResp({ clave, data: { postulaciones: [] } }) })
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps

  const lista = useMemo(() => (resp.clave === clave ? resp.data.postulaciones : null), [resp, clave])
  const programas = useMemo(() => [...new Set((lista || []).map(p => p.programa).filter(Boolean))].sort(), [lista])
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return (lista || []).filter(p => (!estado || p.estado === estado) && (!programa || p.programa === programa)
      && (!q || [p.nombre, p.documento, p.correo, p.codigo, p.curso].some(v => String(v || '').toLowerCase().includes(q))))
  }, [lista, estado, programa, busqueda])

  if (lista === null) return <div className="loading-box"><span className="loader"></span>Cargando postulaciones...</div>

  const recargar = () => { setVer(v => v + 1); onCambio() }
  const aprobar = async (p) => {
    const ok = await confirmAccion({
      title: '¿Asignar el curso?',
      text: `${p.codigo} ${p.curso} (grupo ${p.grupo || '—'}) quedará asignado y aceptado por ${p.nombre}. Las demás postulaciones de este curso se descartarán.`,
      icon: 'question',
      confirmButtonText: 'Sí, asignar',
    })
    if (!ok) return
    try {
      await aprobarPostulacion(p.id)
      toastExito('Curso asignado')
      recargar()
    } catch (e) { alertError(e.message) }
  }

  const conteo = (v) => (v ? lista.filter(p => p.estado === v).length : lista.length)
  const columnas = puedeDecidir ? 7 : 6

  return (
    <>
      <div className="asignia-estados asignia-estados-post" role="group" aria-label="Filtrar por estado de la postulación">
        {FILTROS_ESTADO.map(f => (
          <button key={f.v} type="button" className={`asignia-estado ${f.clase || ''}${estado === f.v ? ' activo' : ''}`}
            aria-pressed={estado === f.v} onClick={() => setEstado(f.v)}>
            <span className="asignia-estado-num">{conteo(f.v)}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" placeholder="Buscar profesor, documento, correo o curso..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar" />
        </div>
        <select className="filter-select" value={programa} onChange={(e) => setPrograma(e.target.value)} aria-label="Programa">
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(busqueda || programa) && <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => { setBusqueda(''); setPrograma('') }}><X size={14} /> Limpiar</button>}
        <span className="results-count">{filtradas.length} postulaci{filtradas.length !== 1 ? 'ones' : 'ón'}</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table asignia-tabla">
          <thead>
            <tr>
              <th>Curso</th><th>Programa</th><th>Horario</th><th>Postulante</th><th>Fecha</th><th>Estado</th>
              {puedeDecidir && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={columnas} className="asignia-sin-filas">No hay postulaciones con estos filtros.</td></tr>
            ) : filtradas.map(p => {
              const abierto = ABIERTO.includes(p.verificacion)
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td data-label="Curso">
                      <div className="asignia-celda">
                        <span>{p.codigo} · {p.curso}</span>
                        <span className="asignia-dato">Grupo {p.grupo || '—'} · {p.horas_semana || '—'} h/semana</span>
                      </div>
                    </td>
                    <td data-label="Programa">
                      <div className="asignia-celda">
                        <span>{p.programa || '—'}</span>
                        <span className="asignia-dato">{p.sede || '—'} · {p.jornada || '—'}</span>
                      </div>
                    </td>
                    <td data-label="Horario"><span className="asignia-dato">{horarioTexto(p.horario) || '—'}</span></td>
                    <td data-label="Postulante">
                      <div className="asignia-celda">
                        <span>{p.nombre}</span>
                        <span className="asignia-dato">CC {p.documento} · {p.correo}</span>
                      </div>
                    </td>
                    <td data-label="Fecha">{new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td data-label="Estado">
                      <div className="asignia-celda">
                        <span className={`badge ${ESTADO_POST[p.estado]?.clase || ''}`}>{ESTADO_POST[p.estado]?.label || p.estado}</span>
                        {p.causal && <span className="asignia-dato">Motivo: {p.causal}</span>}
                        {p.motivo && <span className="asignia-dato">"{p.motivo}"</span>}
                        {p.estado === 'pendiente' && !abierto && <span className="asignia-dato">El curso ya tiene profesor ({p.profesor_nombre || '—'})</span>}
                      </div>
                    </td>
                    {puedeDecidir && (
                      <td data-label="Acciones">
                        {p.estado === 'pendiente' && abierto && rechazoId !== p.id ? (
                          <div className="asignia-post-acciones">
                            <button type="button" className="btn-secondary asignia-btn-fila asignia-btn-peligro" onClick={() => setRechazoId(p.id)}><XCircle size={15} /> Rechazar</button>
                            <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => aprobar(p)}><CheckCircle2 size={15} /> Asignar</button>
                          </div>
                        ) : '—'}
                      </td>
                    )}
                  </tr>
                  {rechazoId === p.id && (
                    <tr>
                      <td colSpan={columnas}>
                        <RechazoPostulacion postulacion={p} onCancelar={() => setRechazoId(null)}
                          onHecho={() => { setRechazoId(null); recargar() }} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
