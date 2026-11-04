import { useState, useEffect, useMemo, useCallback } from 'react'
import { Upload, Link2, Search, Users, Unlock, CheckCircle2 } from 'lucide-react'
import Paginacion from '../../../components/Paginacion'
import ExportMenu from '../../../components/ExportMenu'
import { listarCursosAsignia } from '../../../services/asignia/listarCursosAsignia'
import { cargarProgramacion } from '../../../services/asignia/cargarProgramacion'
import { listarPostulaciones } from '../../../services/asignia/listarPostulaciones'
import { aprobarPostulacion } from '../../../services/asignia/aprobarPostulacion'
import { liberarCurso } from '../../../services/asignia/liberarCurso'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import { ESTADOS, horarioTexto } from './asigniaUtil'
import '../../../styles/main/Sync/SyncMatriculas.css'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Asignia/Asignia.css'

const ENLACE_PROFESORES = `${window.location.origin}/asignia/profesor`

const COLUMNAS_EXPORT = [
  { label: 'Sede', get: c => c.sede },
  { label: 'Programa', get: c => c.programa },
  { label: 'Plan', get: c => c.plan },
  { label: 'Código', get: c => c.codigo },
  { label: 'Curso', get: c => c.curso },
  { label: 'Grupo', get: c => c.grupo },
  { label: 'Jornada', get: c => c.jornada },
  { label: 'Días y horario', get: c => horarioTexto(c.horario) },
  { label: 'Profesor', get: c => c.profesor_nombre },
  { label: 'Documento', get: c => c.profesor_documento },
  { label: 'Correo institucional', get: c => c.profesor_correo },
  { label: 'Verificación', get: c => ESTADOS[c.verificacion]?.label },
  { label: 'Motivo de rechazo', get: c => c.motivo_rechazo || '' },
]

function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado, clase: '' }
  return <span className={`badge asignia-badge ${e.clase}`}>{e.label}</span>
}

function CargaModal({ onClose, onCargado }) {
  const [archivo, setArchivo] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resumen, setResumen] = useState(null)

  const cargar = async () => {
    setEnviando(true)
    try {
      const r = await cargarProgramacion(archivo, periodo.trim())
      setResumen(r)
      onCargado(r.periodo)
    } catch (e) {
      alertError(e.message)
    }
    setEnviando(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !enviando && onClose()}>
      <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-carga-titulo">
        <div className="modal-header">
          <h3 id="asignia-carga-titulo">{resumen ? 'Programación cargada' : 'Cargar programación académica'}</h3>
          <button className="modal-close" onClick={onClose} disabled={enviando} aria-label="Cerrar">✕</button>
        </div>
        {resumen ? (
          <div className="modal-form">
            <p className="asignia-ayuda">Periodo <strong>{resumen.periodo}</strong>, hoja "{resumen.hoja}": {resumen.total} cursos leídos.</p>
            <dl className="asignia-resumen-carga">
              <div><dt>Nuevos</dt><dd>{resumen.nuevos}</dd></div>
              <div><dt>Actualizados</dt><dd>{resumen.actualizados}</dd></div>
              <div><dt>Sin cambios</dt><dd>{resumen.sinCambios}</dd></div>
              <div><dt>Omitidos</dt><dd>{resumen.omitidas}</dd></div>
            </dl>
            {resumen.sinDocumento > 0 && (
              <p className="asignia-aviso">{resumen.sinDocumento} curso(s) tienen profesor pero sin documento o correo: ese profesor no podrá verlos hasta corregir el archivo y volver a cargarlo.</p>
            )}
            {resumen.noEnArchivo > 0 && (
              <p className="asignia-ayuda">{resumen.noEnArchivo} curso(s) del periodo ya estaban cargados y no vienen en este archivo; se dejaron como estaban.</p>
            )}
          </div>
        ) : (
          <div className="modal-form">
            <p className="asignia-ayuda">
              Sube el Excel (.xlsx) de programación. Se lee la pestaña "PROGRAMACIÓN" (o la primera que tenga columnas Código y Curso).
              Si vuelves a cargar el mismo periodo, se actualizan los cursos y se conserva lo que los profesores ya aceptaron o rechazaron.
            </p>
            <div className="modal-field">
              <label htmlFor="asignia-archivo">Archivo</label>
              <input id="asignia-archivo" type="file" accept=".xlsx" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </div>
            <div className="modal-field">
              <label htmlFor="asignia-periodo">Periodo (opcional)</label>
              <input id="asignia-periodo" type="text" maxLength={20} placeholder="Ej. 2027-1. Si lo dejas vacío se toma del archivo"
                value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </div>
          </div>
        )}
        <div className="modal-actions">
          {resumen ? (
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose} disabled={enviando}>Cancelar</button>
              <button className="btn-primary" onClick={cargar} disabled={!archivo || enviando}>
                <Upload size={15} /> {enviando ? 'Cargando...' : 'Cargar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PostulacionesModal({ cursoId, onClose, onCambio }) {
  const [data, setData] = useState(null)

  const cargar = useCallback(() => listarPostulaciones(cursoId)
    .then(setData)
    .catch((e) => { alertError(e.message); onClose() }), [cursoId, onClose])

  useEffect(() => { cargar() }, [cargar])

  const aprobar = async (p) => {
    const ok = await confirmAccion({
      title: '¿Asignar el curso?',
      text: `${data.curso.codigo} ${data.curso.curso} (grupo ${data.curso.grupo || '—'}) quedará asignado y aceptado por ${p.nombre}. Las demás postulaciones de este curso se descartarán.`,
      icon: 'question',
      confirmButtonText: 'Sí, asignar',
    })
    if (!ok) return
    try {
      await aprobarPostulacion(p.id)
      toastExito('Curso asignado')
      onCambio()
      onClose()
    } catch (e) { alertError(e.message) }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-modal asignia-modal-ancho" role="dialog" aria-modal="true" aria-labelledby="asignia-post-titulo">
        <div className="modal-header">
          <h3 id="asignia-post-titulo">Postulaciones</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {!data ? (
          <div className="loading-box"><span className="loader"></span>Cargando...</div>
        ) : (
          <div className="modal-form">
            <p className="asignia-ayuda">
              <strong>{data.curso.codigo} {data.curso.curso}</strong> · Grupo {data.curso.grupo || '—'} · {data.curso.jornada} · {data.curso.sede}
              <br />{horarioTexto(data.curso.horario) || 'Sin horario'}
            </p>
            {data.postulaciones.length === 0 ? (
              <p className="asignia-ayuda">Este curso no tiene postulaciones.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Profesor</th><th>Documento</th><th>Correo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {data.postulaciones.map(p => (
                      <tr key={p.id}>
                        <td data-label="Profesor">{p.nombre}</td>
                        <td data-label="Documento">{p.documento}</td>
                        <td data-label="Correo">{p.correo}</td>
                        <td data-label="Fecha">{new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td data-label="Estado"><span className={`badge ${p.estado === 'aprobada' ? 'badge-synced' : p.estado === 'descartada' ? 'badge-pending' : 'badge-novedad'}`}>{p.estado[0].toUpperCase() + p.estado.slice(1)}</span></td>
                        <td data-label="Acción">
                          {p.estado === 'pendiente' && ['vacio', 'postulado'].includes(data.curso.verificacion) && (
                            <button className="btn-secondary asignia-btn-fila" onClick={() => aprobar(p)}><CheckCircle2 size={15} /> Asignar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default function AsigniaAdmin() {
  const [data, setData] = useState(null) // null = cargando
  const [periodo, setPeriodo] = useState('')
  const [estado, setEstado] = useState('')
  const [sede, setSede] = useState('')
  const [jornada, setJornada] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [cargaAbierta, setCargaAbierta] = useState(false)
  const [postCurso, setPostCurso] = useState(null)

  const cargar = useCallback((p) => listarCursosAsignia(p)
    .then((r) => { setData(r); setPeriodo(r.periodo || '') })
    .catch((e) => { setData({ periodo: null, periodos: [], cursos: [] }); alertError(e.message) }), [])

  useEffect(() => { cargar() }, [cargar])

  const cursos = useMemo(() => data?.cursos || [], [data])
  const conteo = useMemo(() => {
    const c = {}
    cursos.forEach(x => { c[x.verificacion] = (c[x.verificacion] || 0) + 1 })
    return c
  }, [cursos])
  const sedes = useMemo(() => [...new Set(cursos.map(c => c.sede).filter(Boolean))].sort(), [cursos])
  const jornadas = useMemo(() => [...new Set(cursos.map(c => c.jornada).filter(Boolean))].sort(), [cursos])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cursos.filter(c =>
      (!estado || c.verificacion === estado) &&
      (!sede || c.sede === sede) &&
      (!jornada || c.jornada === jornada) &&
      (!q || [c.codigo, c.curso, c.programa, c.grupo, c.profesor_nombre, c.profesor_documento, c.profesor_correo]
        .some(v => (v || '').toLowerCase().includes(q))))
  }, [cursos, estado, sede, jornada, busqueda])


  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage))
  const visibles = filtrados.slice((page - 1) * perPage, page * perPage)

  const cambiarPeriodo = (p) => { setData(null); setPage(1); cargar(p) }

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(ENLACE_PROFESORES)
      toastExito('Enlace copiado')
    } catch {
      alertError(`No se pudo copiar. El enlace es: ${ENLACE_PROFESORES}`)
    }
  }

  const liberar = async (c) => {
    const ok = await confirmAccion({
      title: '¿Liberar el curso?',
      text: `${c.codigo} ${c.curso} (grupo ${c.grupo || '—'}) quedará vacío${c.profesor_nombre ? `, sin ${c.profesor_nombre}` : ''}, y cualquier profesor podrá postularse. Las postulaciones pendientes se descartarán.`,
      confirmButtonText: 'Sí, liberar',
    })
    if (!ok) return
    try {
      await liberarCurso(c.id)
      toastExito('Curso liberado')
      cargar(periodo)
    } catch (e) { alertError(e.message) }
  }

  return (
    <div className="sync-page estilo-hub asignia-page">
      <div className="sync-page-header">
        <div>
          <h2>Asignia</h2>
          <p className="asignia-sub">Programación académica del semestre y verificación de la asignación de profesores.</p>
        </div>
        <div className="asignia-header-acciones">
          <button className="btn-secondary" onClick={copiarEnlace} title={ENLACE_PROFESORES}><Link2 size={15} /> Copiar enlace para profesores</button>
          <button className="btn-primary" onClick={() => setCargaAbierta(true)}><Upload size={15} /> Cargar programación</button>
        </div>
      </div>

      {data === null ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : !data.periodo ? (
        <div className="asignia-vacio">
          <p>Aún no hay programación cargada. Usa "Cargar programación" para subir el Excel del semestre.</p>
        </div>
      ) : (
        <>
          <div className="asignia-estados" role="group" aria-label="Filtrar por verificación">
            <button type="button" className={`asignia-estado${!estado ? ' activo' : ''}`} aria-pressed={!estado} onClick={() => { setEstado(''); setPage(1) }}>
              <span className="asignia-estado-num">{cursos.length}</span><span>Todos</span>
            </button>
            {Object.entries(ESTADOS).map(([k, e]) => (
              <button key={k} type="button" className={`asignia-estado${estado === k ? ' activo' : ''}`} aria-pressed={estado === k} onClick={() => { setEstado(estado === k ? '' : k); setPage(1) }}>
                <span className="asignia-estado-num">{conteo[k] || 0}</span><span>{e.label}</span>
              </button>
            ))}
          </div>

          <div className="filters-bar">
            <div className="filter-input-wrapper">
              <Search size={15} className="filter-icon" />
              <input className="filter-input" placeholder="Buscar curso, código, programa, profesor, documento o correo..."
                value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1) }} aria-label="Buscar" />
            </div>
            <select className="filter-select" value={periodo} onChange={(e) => cambiarPeriodo(e.target.value)} aria-label="Periodo">
              {data.periodos.map(p => <option key={p.periodo} value={p.periodo}>Periodo {p.periodo}</option>)}
            </select>
            <select className="filter-select" value={sede} onChange={(e) => { setSede(e.target.value); setPage(1) }} aria-label="Sede">
              <option value="">Todas las sedes</option>
              {sedes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={jornada} onChange={(e) => { setJornada(e.target.value); setPage(1) }} aria-label="Jornada">
              <option value="">Todas las jornadas</option>
              {jornadas.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <ExportMenu title={`Asignia ${data.periodo}`} columns={COLUMNAS_EXPORT} rows={filtrados} allRows={cursos} />
            <span className="results-count">{filtrados.length} curso{filtrados.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table asignia-tabla">
              <thead>
                <tr>
                  <th>Programa</th><th>Código</th><th>Curso</th><th>Jornada</th><th>Días y horario</th>
                  <th>Profesor</th><th>Verificación</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr><td colSpan={8} className="asignia-sin-filas">No hay cursos con estos filtros.</td></tr>
                ) : visibles.map(c => (
                  <tr key={c.id}>
                    <td data-label="Programa">
                      <div>{c.programa || '—'}</div>
                      <div className="asignia-dato">Plan {c.plan || '—'} · {c.sede}</div>
                    </td>
                    <td data-label="Código">{c.codigo}</td>
                    <td data-label="Curso">
                      <div>{c.curso}</div>
                      <div className="asignia-dato">Grupo {c.grupo || '—'}{c.agrupamiento ? ` · Agrup. ${c.agrupamiento}` : ''}</div>
                    </td>
                    <td data-label="Jornada">{c.jornada || '—'}</td>
                    <td data-label="Días y horario">
                      {c.horario?.length ? c.horario.map((h, i) => (
                        <div key={i} className="asignia-horario">{h.dia} {h.hora}{h.aula ? ` · ${h.aula}` : ''}</div>
                      )) : '—'}
                    </td>
                    <td data-label="Profesor">
                      {c.profesor_nombre ? (
                        <>
                          <div>{c.profesor_nombre}</div>
                          <div className="asignia-dato">{c.profesor_documento || 'Sin documento'} · {c.profesor_correo || 'sin correo'}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td data-label="Verificación">
                      <EstadoBadge estado={c.verificacion} />
                      {c.verificacion === 'rechazado' && c.motivo_rechazo && <div className="asignia-dato">"{c.motivo_rechazo}"</div>}
                    </td>
                    <td data-label="Acciones">
                      <div className="asignia-acciones">
                        {(c.postulaciones_pendientes > 0 || c.verificacion === 'postulado') && (
                          <button className="onix-texto-btn" onClick={() => setPostCurso(c.id)}>
                            <Users size={15} /> Postulaciones ({c.postulaciones_pendientes})
                          </button>
                        )}
                        {c.verificacion !== 'vacio' && (
                          <button className="onix-texto-btn onix-texto-peligro" onClick={() => liberar(c)}><Unlock size={15} /> Liberar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion page={page} totalPages={totalPages} total={filtrados.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
        </>
      )}

      {cargaAbierta && (
        <CargaModal onClose={() => setCargaAbierta(false)} onCargado={(p) => cargar(p)} />
      )}
      {postCurso && (
        <PostulacionesModal cursoId={postCurso} onClose={() => setPostCurso(null)} onCambio={() => cargar(periodo)} />
      )}
    </div>
  )
}
