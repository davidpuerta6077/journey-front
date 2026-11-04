import { useState, useEffect, useMemo, useCallback } from 'react'
import { Upload, Link2, Search, Users, Unlock, CheckCircle2, Download, CalendarDays, GraduationCap } from 'lucide-react'
import Paginacion from '../../../components/Paginacion'
import ExportMenu from '../../../components/ExportMenu'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import { listarCursosAsignia } from '../../../services/asignia/listarCursosAsignia'
import { cargarProgramacion } from '../../../services/asignia/cargarProgramacion'
import { cargarProfesores } from '../../../services/asignia/cargarProfesores'
import { listarProfesores } from '../../../services/asignia/listarProfesores'
import { listarPostulaciones } from '../../../services/asignia/listarPostulaciones'
import { aprobarPostulacion } from '../../../services/asignia/aprobarPostulacion'
import { liberarCurso } from '../../../services/asignia/liberarCurso'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import { ESTADOS, horarioTexto } from './asigniaUtil'
import '../../../styles/main/Sync/SyncMatriculas.css'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Asignia/Asignia.css'

const ENLACE_PROFESORES = `${window.location.origin}/asignia/profesor`
const FORMATO_PROGRAMACION = '/asignia/formato-programacion-asignia.xlsx'
const FORMATO_PROFESORES = '/asignia/formato-profesores-asignia.xlsx'

// Horas que suman para la carga del profesor: cursos asignados o aceptados.
const CUENTA_HORAS = ['asignado', 'aceptado']
const claveProfesor = (documento, nombre) => documento || (nombre ? `n:${nombre.toLowerCase()}` : '')
const horasNum = (h) => Number(String(h || '').replace(',', '.')) || 0
const fmtHoras = (n) => (Number.isInteger(n) ? n : n.toFixed(1))

// { claveProfesor: { horas, cursos } } del periodo cargado.
function cargaPorProfesor(cursos) {
  const m = {}
  for (const c of cursos) {
    const k = claveProfesor(c.profesor_documento, c.profesor_nombre)
    if (!k || !CUENTA_HORAS.includes(c.verificacion)) continue
    m[k] = m[k] || { horas: 0, cursos: 0 }
    m[k].horas += horasNum(c.horas_semana)
    m[k].cursos += 1
  }
  return m
}

const COLUMNAS_EXPORT = [
  { label: 'Sede', get: c => c.sede },
  { label: 'Programa', get: c => c.programa },
  { label: 'Plan', get: c => c.plan },
  { label: 'Código', get: c => c.codigo },
  { label: 'Curso', get: c => c.curso },
  { label: 'Grupo', get: c => c.grupo },
  { label: 'Jornada', get: c => c.jornada },
  { label: 'H. semana', get: c => c.horas_semana },
  { label: 'Días y horario', get: c => horarioTexto(c.horario) },
  { label: 'Profesor', get: c => c.profesor_nombre },
  { label: 'Documento', get: c => c.profesor_documento },
  { label: 'Correo institucional', get: c => c.profesor_correo },
  { label: 'Horas acumuladas del profesor', get: c => c.horas_profesor ?? '' },
  { label: 'Verificación', get: c => ESTADOS[c.verificacion]?.label },
  { label: 'Motivo de rechazo', get: c => c.motivo_rechazo || '' },
]

// Filtros por columna (estilo Excel), mismo texto que se ve en la celda.
const COL_GETTERS = {
  sede: c => c.sede || '—',
  programa: c => c.programa || '—',
  codigo: c => c.codigo,
  curso: c => c.curso,
  grupo: c => c.grupo || '—',
  jornada: c => c.jornada || '—',
  horario: c => [...new Set((c.horario || []).map(h => h.dia))].join(', ') || '—',
  profesor: c => c.profesor_nombre || '—',
  horas: c => (c.horas_profesor === null ? '—' : `${c.horas_profesor} h`),
  verificacion: c => ESTADOS[c.verificacion]?.label || c.verificacion,
}

const COLUMNAS_PROF_EXPORT = [
  { label: 'Documento', get: p => p.documento },
  { label: 'Profesor', get: p => p.nombre },
  { label: 'Correo institucional', get: p => p.correo },
  { label: 'Vinculación', get: p => p.vinculacion },
  { label: 'Cursos en el periodo', get: p => p.cursos },
  { label: 'Horas acumuladas', get: p => p.horas },
]
const COL_GETTERS_PROF = {
  documento: p => p.documento,
  nombre: p => p.nombre,
  correo: p => p.correo || '—',
  vinculacion: p => p.vinculacion || '—',
  cursos: p => String(p.cursos),
  horas: p => `${p.horas} h`,
}

function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado, clase: '' }
  return <span className={`badge asignia-badge ${e.clase}`}>{e.label}</span>
}

function CargaModal({ tipo = 'programacion', onClose, onCargado }) {
  const esProf = tipo === 'profesores'
  const [archivo, setArchivo] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resumen, setResumen] = useState(null)

  const cargar = async () => {
    setEnviando(true)
    try {
      const r = esProf ? await cargarProfesores(archivo) : await cargarProgramacion(archivo, periodo.trim())
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
          <h3 id="asignia-carga-titulo">{esProf
            ? (resumen ? 'Profesores cargados' : 'Cargar base de profesores')
            : (resumen ? 'Programación cargada' : 'Cargar programación académica')}</h3>
          <button className="modal-close" onClick={onClose} disabled={enviando} aria-label="Cerrar">✕</button>
        </div>
        {resumen && esProf ? (
          <div className="modal-form">
            <p className="asignia-ayuda">Hoja "{resumen.hoja}": {resumen.total} profesores leídos.</p>
            <dl className="asignia-resumen-carga">
              <div><dt>Nuevos</dt><dd>{resumen.nuevos}</dd></div>
              <div><dt>Actualizados</dt><dd>{resumen.actualizados}</dd></div>
              <div><dt>Omitidos</dt><dd>{resumen.omitidas}</dd></div>
            </dl>
            {resumen.omitidas > 0 && <p className="asignia-ayuda">Se omiten las filas sin documento, nombre o correo.</p>}
          </div>
        ) : resumen ? (
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
            {esProf ? (
              <p className="asignia-ayuda">
                Sube el Excel (.xlsx) con los profesores de la institución. Se lee la pestaña "BD Profesores" (o la primera con columnas
                Identificación/Documento y Profesor) y el correo institucional. Así pueden entrar y postularse también los profesores que
                no tienen cursos en la programación. Si un profesor ya existe, se actualizan sus datos.
              </p>
            ) : (
              <p className="asignia-ayuda">
                Sube el Excel (.xlsx) de programación. Se lee la pestaña "PROGRAMACIÓN" (o la primera que tenga columnas Código y Curso).
                Si vuelves a cargar el mismo periodo, se actualizan los cursos y se conserva lo que los profesores ya aceptaron o rechazaron.
              </p>
            )}
            <a className="asignia-enlace-formato" href={esProf ? FORMATO_PROFESORES : FORMATO_PROGRAMACION} download>
              <Download size={15} /> Descargar formato guía
            </a>
            <div className="modal-field">
              <label htmlFor="asignia-archivo">Archivo</label>
              <input id="asignia-archivo" type="file" accept=".xlsx" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </div>
            {!esProf && (
              <div className="modal-field">
                <label htmlFor="asignia-periodo">Periodo (opcional)</label>
                <input id="asignia-periodo" type="text" maxLength={20} placeholder="Ej. 2027-1. Si lo dejas vacío se toma del archivo"
                  value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              </div>
            )}
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

function ProfesoresTab({ profesores, carga, periodo }) {
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // Base de profesores con su carga (cursos y horas) del periodo mostrado.
  const filas = useMemo(() => profesores.map(p => {
    const c = carga[claveProfesor(p.documento, p.nombre)] || { horas: 0, cursos: 0 }
    return { ...p, cursos: c.cursos, horas: fmtHoras(c.horas) }
  }), [profesores, carga])

  const base = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? filas.filter(p => [p.documento, p.nombre, p.correo, p.vinculacion].some(v => (v || '').toLowerCase().includes(q))) : filas
  }, [filas, busqueda])
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(base, COL_GETTERS_PROF, () => setPage(1))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const visibles = filtered.slice((page - 1) * perPage, page * perPage)

  if (!profesores.length) {
    return (
      <div className="asignia-vacio">
        <p>Aún no hay base de profesores. Usa "Cargar profesores" para subir el Excel (pestaña "BD Profesores"; "Formato guía" trae un ejemplo).</p>
      </div>
    )
  }

  return (
    <>
      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" placeholder="Buscar documento, nombre, correo o vinculación..."
            value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1) }} aria-label="Buscar profesor" />
        </div>
        {anyFilter && <button className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
        <ExportMenu title="Asignia profesores" columns={COLUMNAS_PROF_EXPORT} rows={filtered} allRows={filas} />
        <span className="results-count">{filtered.length} profesor{filtered.length !== 1 ? 'es' : ''}</span>
      </div>
      <div className="table-wrapper">
        <table className="data-table asignia-tabla">
          <thead>
            <tr>
              <th><ColumnFilter label="Documento" {...colProps('documento')} /></th>
              <th><ColumnFilter label="Profesor" {...colProps('nombre')} /></th>
              <th><ColumnFilter label="Correo institucional" {...colProps('correo')} /></th>
              <th><ColumnFilter label="Vinculación" {...colProps('vinculacion')} /></th>
              <th><ColumnFilter label={`Cursos ${periodo || ''}`} {...colProps('cursos')} /></th>
              <th><ColumnFilter label="Horas acumuladas" {...colProps('horas')} /></th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr><td colSpan={6} className="asignia-sin-filas">No hay profesores con estos filtros.</td></tr>
            ) : visibles.map(p => (
              <tr key={p.id}>
                <td data-label="Documento">{p.documento}</td>
                <td data-label="Profesor">{p.nombre}</td>
                <td data-label="Correo institucional">{p.correo || '—'}</td>
                <td data-label="Vinculación">{p.vinculacion || '—'}</td>
                <td data-label="Cursos">{p.cursos}</td>
                <td data-label="Horas acumuladas"><strong>{p.horas} h</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
    </>
  )
}

export default function AsigniaAdmin() {
  const [tab, setTab] = useState('programacion')
  const [data, setData] = useState(null) // null = cargando
  const [profesores, setProfesores] = useState([])
  const [periodo, setPeriodo] = useState('')
  const [estado, setEstado] = useState('')
  const [sede, setSede] = useState('')
  const [jornada, setJornada] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [cargaAbierta, setCargaAbierta] = useState(null) // 'programacion' | 'profesores'
  const [postCurso, setPostCurso] = useState(null)

  const cargar = useCallback((p) => listarCursosAsignia(p)
    .then((r) => { setData(r); setPeriodo(r.periodo || '') })
    .catch((e) => { setData({ periodo: null, periodos: [], cursos: [] }); alertError(e.message) }), [])

  const cargarProfes = useCallback(() => listarProfesores()
    .then(setProfesores)
    .catch((e) => alertError(e.message)), [])

  useEffect(() => { cargar(); cargarProfes() }, [cargar, cargarProfes])

  const carga = useMemo(() => cargaPorProfesor(data?.cursos || []), [data])
  // Cada curso con las horas acumuladas de su profesor en el periodo.
  const cursos = useMemo(() => (data?.cursos || []).map(c => {
    const k = claveProfesor(c.profesor_documento, c.profesor_nombre)
    return { ...c, horas_profesor: k ? fmtHoras(carga[k]?.horas || 0) : null }
  }), [data, carga])
  const conteo = useMemo(() => {
    const c = {}
    cursos.forEach(x => { c[x.verificacion] = (c[x.verificacion] || 0) + 1 })
    return c
  }, [cursos])
  const sedes = useMemo(() => [...new Set(cursos.map(c => c.sede).filter(Boolean))].sort(), [cursos])
  const jornadas = useMemo(() => [...new Set(cursos.map(c => c.jornada).filter(Boolean))].sort(), [cursos])

  const baseFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cursos.filter(c =>
      (!estado || c.verificacion === estado) &&
      (!sede || c.sede === sede) &&
      (!jornada || c.jornada === jornada) &&
      (!q || [c.codigo, c.curso, c.programa, c.grupo, c.sede, c.profesor_nombre, c.profesor_documento, c.profesor_correo]
        .some(v => (v || '').toLowerCase().includes(q))))
  }, [cursos, estado, sede, jornada, busqueda])
  const { filtered: filtrados, colProps, anyFilter, clearFilters } = useColumnFilters(baseFiltrada, COL_GETTERS, () => setPage(1))

  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage))
  const visibles = filtrados.slice((page - 1) * perPage, page * perPage)

  const hayFiltros = anyFilter || estado || sede || jornada || busqueda
  const limpiarTodo = () => { clearFilters(); setEstado(''); setSede(''); setJornada(''); setBusqueda(''); setPage(1) }
  const cambiarPeriodo = (p) => { setData(null); setPage(1); setSede(''); setJornada(''); cargar(p) }

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

  const esProf = tab === 'profesores'

  return (
    <div className="sync-page estilo-hub asignia-page">
      <div className="sync-page-header">
        <div>
          <h2>Asignia</h2>
          <p className="asignia-sub">Programación académica del semestre y verificación de la asignación de profesores.</p>
        </div>
        <div className="asignia-header-acciones">
          <button className="btn-secondary" onClick={copiarEnlace} title={ENLACE_PROFESORES}><Link2 size={15} /> Copiar enlace para profesores</button>
          <a className="btn-secondary" href={esProf ? FORMATO_PROFESORES : FORMATO_PROGRAMACION} download><Download size={15} /> Formato guía</a>
          <button className="btn-primary" onClick={() => setCargaAbierta(tab)}>
            <Upload size={15} /> {esProf ? 'Cargar profesores' : 'Cargar programación'}
          </button>
        </div>
      </div>

      <nav className="section-nav" aria-label="Secciones de Asignia">
        <button type="button" className={`section-nav-tab${!esProf ? ' active' : ''}`} aria-current={!esProf ? 'page' : undefined} onClick={() => setTab('programacion')}>
          <CalendarDays size={16} /> Programación
        </button>
        <button type="button" className={`section-nav-tab${esProf ? ' active' : ''}`} aria-current={esProf ? 'page' : undefined} onClick={() => setTab('profesores')}>
          <GraduationCap size={16} /> Profesores ({profesores.length})
        </button>
      </nav>

      {esProf ? (
        <ProfesoresTab profesores={profesores} carga={carga} periodo={data?.periodo} />
      ) : data === null ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : !data.periodo ? (
        <div className="asignia-vacio">
          <p>Aún no hay programación cargada. Usa "Cargar programación" para subir el Excel del semestre ("Formato guía" trae un ejemplo).</p>
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
              <input className="filter-input" placeholder="Buscar curso, código, grupo, programa, sede, profesor, documento o correo..."
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
            {hayFiltros && <button className="btn-secondary" onClick={limpiarTodo}>Limpiar filtros</button>}
            <ExportMenu title={`Asignia ${data.periodo}`} columns={COLUMNAS_EXPORT} rows={filtrados} allRows={cursos} />
            <span className="results-count">{filtrados.length} curso{filtrados.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table asignia-tabla">
              <thead>
                <tr>
                  <th><ColumnFilter label="Sede" {...colProps('sede')} /></th>
                  <th><ColumnFilter label="Programa" {...colProps('programa')} /></th>
                  <th><ColumnFilter label="Código" {...colProps('codigo')} /></th>
                  <th><ColumnFilter label="Curso" {...colProps('curso')} /></th>
                  <th><ColumnFilter label="Grupo" {...colProps('grupo')} /></th>
                  <th><ColumnFilter label="Jornada" {...colProps('jornada')} /></th>
                  <th><ColumnFilter label="Horario" {...colProps('horario')} /></th>
                  <th><ColumnFilter label="Profesor" {...colProps('profesor')} /></th>
                  <th><ColumnFilter label="Horas" {...colProps('horas')} /></th>
                  <th><ColumnFilter label="Verificación" {...colProps('verificacion')} /></th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr><td colSpan={11} className="asignia-sin-filas">No hay cursos con estos filtros.</td></tr>
                ) : visibles.map(c => (
                  <tr key={c.id}>
                    <td data-label="Sede">{c.sede || '—'}</td>
                    <td data-label="Programa">
                      <div className="asignia-celda">
                        <span>{c.programa || '—'}</span>
                        {c.plan && <span className="asignia-dato">Plan {c.plan}</span>}
                      </div>
                    </td>
                    <td data-label="Código">{c.codigo}</td>
                    <td data-label="Curso">
                      <div className="asignia-celda">
                        <span>{c.curso}</span>
                        {(c.agrupamiento || c.horas_semana) && (
                          <span className="asignia-dato">{[c.horas_semana && `${c.horas_semana} h/sem`, c.agrupamiento && `Agrup. ${c.agrupamiento}`].filter(Boolean).join(' · ')}</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Grupo">{c.grupo || '—'}</td>
                    <td data-label="Jornada">{c.jornada || '—'}</td>
                    <td data-label="Días y horario">
                      {c.horario?.length ? (
                        <div className="asignia-celda">
                          {c.horario.map((h, i) => (
                            <span key={i} className="asignia-horario" title={`${h.dia} ${h.hora}${h.aula ? ` · ${h.aula}` : ''}`}>
                              <strong>{h.dia.slice(0, 3)}</strong> {h.hora.replace(/:00/g, '').replace(' - ', '–')}{h.aula ? <span className="asignia-dato"> · {h.aula}</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td data-label="Profesor">
                      {c.profesor_nombre ? (
                        <div className="asignia-celda">
                          <span>{c.profesor_nombre}</span>
                          <span className="asignia-dato">{c.profesor_documento || 'Sin documento'}</span>
                          <span className="asignia-dato asignia-correo" title={c.profesor_correo}>{c.profesor_correo || 'Sin correo'}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td data-label="Horas profesor" title="Suma de horas semanales de los cursos asignados o aceptados del profesor en el periodo">
                      {c.horas_profesor === null ? '—' : <strong>{c.horas_profesor} h</strong>}
                    </td>
                    <td data-label="Verificación">
                      <div className="asignia-celda">
                        <EstadoBadge estado={c.verificacion} />
                        {c.verificacion === 'rechazado' && c.motivo_rechazo && <span className="asignia-dato">"{c.motivo_rechazo}"</span>}
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <div className="asignia-acciones">
                        {(c.postulaciones_pendientes > 0 || c.verificacion === 'postulado') && (
                          <button className="btn-icon asignia-accion" onClick={() => setPostCurso(c.id)}
                            title={`Ver postulaciones (${c.postulaciones_pendientes} pendientes)`} aria-label={`Ver postulaciones (${c.postulaciones_pendientes} pendientes)`}>
                            <Users size={15} /><span className="asignia-accion-num">{c.postulaciones_pendientes}</span>
                          </button>
                        )}
                        {c.verificacion !== 'vacio' && (
                          <button className="btn-icon asignia-accion asignia-btn-peligro" onClick={() => liberar(c)} title="Liberar curso" aria-label="Liberar curso">
                            <Unlock size={15} />
                          </button>
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
        <CargaModal tipo={cargaAbierta} onClose={() => setCargaAbierta(null)}
          onCargado={(p) => (cargaAbierta === 'profesores' ? cargarProfes() : cargar(p))} />
      )}
      {postCurso && (
        <PostulacionesModal cursoId={postCurso} onClose={() => setPostCurso(null)} onCambio={() => cargar(periodo)} />
      )}
    </div>
  )
}
