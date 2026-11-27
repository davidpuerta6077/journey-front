import { useState, useEffect, useMemo, useCallback } from 'react'
import { Upload, Link2, Search, Users, Lock, LockOpen, UserMinus, CheckCircle2, XCircle, Download, CalendarDays, GraduationCap, UserPlus, Pencil, Trash2, Save, Plus, X, Table2, Settings, Inbox, RefreshCw } from 'lucide-react'
import AsigniaCalendario from './AsigniaCalendario'
import AsigniaConfiguracion from './AsigniaConfiguracion'
import { simularCruces } from '../../../services/asignia/simularCruces'
import { TIPO_CRUCE } from './calendario/calendarioUtil'
import Paginacion from '../../../components/Paginacion'
import ExportMenu from '../../../components/ExportMenu'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import { listarCursosAsignia } from '../../../services/asignia/listarCursosAsignia'
import { cargarProgramacion } from '../../../services/asignia/cargarProgramacion'
import { cargarProfesores } from '../../../services/asignia/cargarProfesores'
import { sincronizarProfesores } from '../../../services/asignia/sincronizarProfesores'
import { obtenerPeriodos } from '../../../services/asignia/obtenerPeriodos'
import { listarProfesores } from '../../../services/asignia/listarProfesores'
import { crearProfesor } from '../../../services/asignia/crearProfesor'
import { actualizarProfesor } from '../../../services/asignia/actualizarProfesor'
import { borrarProfesor } from '../../../services/asignia/borrarProfesor'
import { crearCurso } from '../../../services/asignia/crearCurso'
import { actualizarCurso } from '../../../services/asignia/actualizarCurso'
import { borrarCurso } from '../../../services/asignia/borrarCurso'
import { listarPostulaciones } from '../../../services/asignia/listarPostulaciones'
import { aprobarPostulacion } from '../../../services/asignia/aprobarPostulacion'
import RechazoPostulacion from './RechazoPostulacion'
import AsigniaPostulaciones from './AsigniaPostulaciones'
import { VerCalificacion } from './CalificacionSidem'
import { VerInduccion } from './InduccionDocente'
import { liberarCurso } from '../../../services/asignia/liberarCurso'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import { usePermissions } from '../../../services/PermissionsContext'
import { ESTADOS, ESTADO_POST, horarioTexto, DIAS_SEMANA, FRANJAS, cumpleHorario, horasDistintas, alertaHoras } from './asigniaUtil'
import { Coincidencia, AvatarProfesor, RequerimientosChecks, AlertaHoras, CopiarDato, BarraCarga } from './PerfilProfesor'
import { listarSolicitudesHoras } from '../../../services/asignia/listarSolicitudesHoras'
import SolicitudesTutor from './SolicitudesTutor'
import { listarRequerimientos } from '../../../services/asignia/listarRequerimientos'
import { listarNiveles } from '../../../services/asignia/listarNiveles'
import { listarPerfilesCurso } from '../../../services/asignia/listarPerfilesCurso'
import { guardarPerfilCurso } from '../../../services/asignia/guardarPerfilCurso'
import '../../../styles/main/Sync/SyncMatriculas.css'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Asignia/Asignia.css'

const ENLACE_PROFESORES = `${window.location.origin}/mi-catedra/profesor`
const FORMATO_PROGRAMACION = '/formatos/asignia/formato-programacion-asignia.xlsx'
const FORMATO_PROFESORES = '/formatos/asignia/formato-profesores-asignia.xlsx'

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
  { label: 'Celular', get: p => p.celular || '' },
  { label: 'Correo institucional', get: p => p.correo },
  { label: 'Vinculación', get: p => p.vinculacion },
  { label: 'Fecha expedición cédula', get: p => p.fecha_expedicion_cedula || '' },
  { label: 'Cursos en el periodo', get: p => p.cursos },
  { label: 'Horas acumuladas', get: p => p.horas },
  { label: 'Nivel académico', get: p => p.nivel?.nombre || '' },
  { label: 'Alerta de horas', get: p => ({ minimo: 'Bajo el mínimo', maximo: 'Cupo alcanzado' })[p.alerta] || '' },
  { label: 'Años de experiencia', get: p => p.anios_experiencia ?? 0 },
  { label: 'Inducción realizada', get: p => (p.induccion_realizada ? 'Sí' : 'No') },
  { label: 'Calificación SICAU', get: p => p.calificacion_sicau ?? '' },
  { label: 'Habilidades', get: p => (p.habilidades || []).map(h => `${h.nombre} (${h.nivel ?? '—'}/10)`).join(', ') },
]
const fmtFechaCorta = (f) => new Date(`${f}T00:00:00Z`).toLocaleDateString('es-CO', { timeZone: 'UTC' })

const COL_GETTERS_PROF = {
  documento: p => p.documento,
  nombre: p => p.nombre,
  correo: p => p.correo || '—',
  vinculacion: p => p.vinculacion || '—',
  cursos: p => String(p.cursos),
  horas: p => `${p.horas} h`,
  nivel: p => (p.nivel ? `${p.nivel.nombre}${p.alerta === 'minimo' ? ' · bajo el mínimo' : p.alerta === 'maximo' ? ' · cupo alcanzado' : ''}` : 'Sin nivel'),
  induccion: p => (p.induccion_realizada ? 'Sí' : 'No'),
  sicau: p => (p.calificacion_sicau ?? 'Sin registrar').toString(),
}

// Filtros rápidos de la pestaña Profesores (lo que el líder revisa a diario).
const RAPIDOS = [
  { v: 'minimo', label: 'Bajo el mínimo de horas', cumple: p => p.alerta === 'minimo' },
  { v: 'induccion', label: 'Sin inducción', cumple: p => !p.induccion_realizada },
  { v: 'habilidades', label: 'Sin habilidades', cumple: p => !(p.habilidades || []).length },
]

// Habilidades que marcó el profesor con su nivel de dominio, en un desplegable para no cargar la tabla.
function HabilidadesProfesor({ habilidades = [] }) {
  if (!habilidades.length) return <span className="asignia-dato">Sin habilidades</span>
  const orden = [...habilidades].sort((x, y) => (y.nivel || 0) - (x.nivel || 0))
  const chip = (h) => <li key={h.id} className="asignia-hab-chip">{h.nombre}<strong>{h.nivel ?? '—'}</strong></li>
  return (
    <div className="asignia-habilidades">
      <ul className="asignia-hab-chips" aria-label="Habilidades con su nivel de 1 a 10">{orden.slice(0, 2).map(chip)}</ul>
      {orden.length > 2 && (
        <details>
          <summary>+{orden.length - 2} más</summary>
          <ul className="asignia-hab-chips">{orden.slice(2).map(chip)}</ul>
        </details>
      )}
    </div>
  )
}

function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado, clase: '' }
  return <span className={`badge asignia-badge ${e.clase}`}>{e.label}</span>
}

// Profesores registrados en la pestaña Profesores a partir de la programación.
function ResumenProfesores({ r }) {
  return (
    <>
      <h4 className="modal-section-title">Profesores ({r.total} en el archivo)</h4>
      <dl className="asignia-resumen-carga">
        <div><dt>Nuevos</dt><dd>{r.nuevos}</dd></div>
        <div><dt>Actualizados</dt><dd>{r.actualizados}</dd></div>
        <div><dt>Sin cambios</dt><dd>{r.sinCambios}</dd></div>
        <div><dt>Filas con error</dt><dd>{r.conError}</dd></div>
      </dl>
      {r.conError > 0 && (
        <>
          <p className="asignia-aviso">Estas filas tienen profesor pero no se pudo registrar: corrige el archivo y vuelve a cargarlo.</p>
          <ul className="asignia-lista-confirmar">
            {r.errores.map((e, i) => (
              <li key={i}><strong>{e.codigo} · {e.curso} (G{e.grupo || '—'})</strong><span>{e.profesor}: {e.motivo}</span></li>
            ))}
          </ul>
          {r.conError > r.errores.length && <p className="asignia-ayuda">…y {r.conError - r.errores.length} más.</p>}
        </>
      )}
    </>
  )
}

// Periodos sugeridos (AAAA-1/AAAA-2 desde el año activo −1 a +2 y los que ya existen).
function usePeriodosSugeridos() {
  const [lista, setLista] = useState([])
  useEffect(() => { obtenerPeriodos().then(r => setLista(r.periodos.map(p => p.periodo))).catch(() => {}) }, [])
  return lista
}

const ListaPeriodos = ({ id, periodos }) => <datalist id={id}>{periodos.map(p => <option key={p} value={p} />)}</datalist>

function CargaModal({ tipo = 'programacion', onClose, onCargado }) {
  const sugeridos = usePeriodosSugeridos()
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
            {resumen.conError > 0 && (
              <div className="asignia-aviso" role="alert">
                <strong>{resumen.conError} dato(s) no se pudieron leer</strong> (el resto del profesor sí se guardó):
                <ul className="asignia-cruces-carga">
                  {resumen.errores.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
                {resumen.conError > resumen.errores.length && <span>… y {resumen.conError - resumen.errores.length} más.</span>}
              </div>
            )}
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
            {resumen.cruces?.total > 0 && (
              <div className="asignia-aviso" role="alert">
                <strong>{resumen.cruces.total} cruce(s) de horario en el periodo</strong> (la carga masiva se guarda igual; revísalos en Calendario):
                <ul className="asignia-cruces-carga">
                  {resumen.cruces.lista.map((c, i) => (
                    <li key={i}>{TIPO_CRUCE[c.tipo]} {c.etiqueta} · {c.dia} {c.inicio}–{c.fin}: {c.cursos.join(' y ')}</li>
                  ))}
                </ul>
                {resumen.cruces.total > resumen.cruces.lista.length && <span>… y {resumen.cruces.total - resumen.cruces.lista.length} más.</span>}
              </div>
            )}
            {resumen.profesores && <ResumenProfesores r={resumen.profesores} />}
          </div>
        ) : (
          <div className="modal-form">
            {esProf ? (
              <p className="asignia-ayuda">
                Sube el Excel (.xlsx) con los profesores de la institución. Se lee la pestaña "BD Profesores" (o la primera con columnas
                Identificación/Documento y Profesor) y el correo institucional. Así pueden entrar y postularse también los profesores que
                no tienen cursos en la programación. Si un profesor ya existe, se actualizan sus datos. Columnas opcionales: Celular,
                Tiempo de experiencia como docente universitario (texto libre, ej. "Entre 3 y 4 años": se toma el primer número), Fecha
                de expedición de la cédula, Nivel académico o Nivel de formación (con el mismo nombre de Configuración), Inducción (Sí/No)
                y Calificación SICAU (último semestre calificado); si vienen vacías no se borra lo que ya estaba guardado.
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
                  list="asignia-periodos-carga" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
                <ListaPeriodos id="asignia-periodos-carga" periodos={sugeridos} />
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

function PostulacionesModal({ cursoId, onClose, onCambio, puedeDecidir }) {
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

  const [rechazoId, setRechazoId] = useState(null) // postulación con el formulario de rechazo abierto

  const abierto = puedeDecidir && data && ['vacio', 'postulado'].includes(data.curso.verificacion)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-modal asignia-modal-post" role="dialog" aria-modal="true" aria-labelledby="asignia-post-titulo">
        <div className="modal-header">
          <h3 id="asignia-post-titulo">Postulaciones</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {!data ? (
          <div className="loading-box"><span className="loader"></span>Cargando...</div>
        ) : (
          <div className="modal-form">
            <section className="asignia-ficha" aria-label="Curso">
              <h4 className="asignia-ficha-titulo">{data.curso.curso}</h4>
              <dl className="asignia-ficha-datos">
                <div><dt>Código</dt><dd>{data.curso.codigo}</dd></div>
                <div><dt>Grupo</dt><dd>{data.curso.grupo || '—'}</dd></div>
                <div><dt>Jornada</dt><dd>{data.curso.jornada || '—'}</dd></div>
                <div><dt>H. semana</dt><dd>{data.curso.horas_semana || '—'}</dd></div>
                <div className="asignia-ficha-ancho"><dt>Programa</dt><dd>{data.curso.programa || '—'}</dd></div>
                <div className="asignia-ficha-ancho"><dt>Sede</dt><dd>{data.curso.sede || '—'}</dd></div>
                <div className="asignia-ficha-completo">
                  <dt>Días y horario</dt>
                  <dd>
                    {(data.curso.horario || []).length === 0 ? 'Sin horario' : (
                      <ul className="asignia-ficha-horario">
                        {data.curso.horario.map((h, i) => (
                          <li key={i}><strong>{h.dia}</strong> {h.hora}{h.aula ? ` · ${h.aula}` : ''}</li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
            <h4 className="modal-section-title">Postulaciones ({data.postulaciones.length})</h4>
            {data.postulaciones.length === 0 ? (
              <p className="asignia-ayuda">Este curso no tiene postulaciones.</p>
            ) : (
              <ul className="asignia-post-lista">
                {data.postulaciones.map(p => (
                  <li key={p.id} className="asignia-post-item">
                    <div className="asignia-post-info">
                      <div className="asignia-post-nombre">
                        <strong>{p.nombre}</strong>
                        <span className={`badge ${ESTADO_POST[p.estado]?.clase || ''}`}>{ESTADO_POST[p.estado]?.label || p.estado}</span>
                        <Coincidencia m={p.coincidencia} compacto />
                      </div>
                      <span className="asignia-post-datos">
                        CC {p.documento} · {p.correo} · {new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        {' · '}Calificación SICAU: {p.calificacion_sicau ?? 'sin registrar'}
                      </span>
                      <span className="asignia-acciones"><VerCalificacion profesor={p} periodo={data.curso.periodo} /><VerInduccion profesor={p} /></span>
                      {p.causal && <span className="asignia-post-datos">Motivo: {p.causal}{p.motivo ? ` — "${p.motivo}"` : ''}</span>}
                    </div>
                    {p.estado === 'pendiente' && abierto && rechazoId !== p.id && (
                      <div className="asignia-post-acciones">
                        <button className="btn-secondary asignia-btn-fila asignia-btn-peligro" onClick={() => setRechazoId(p.id)}><XCircle size={15} /> Rechazar</button>
                        <button className="btn-secondary asignia-btn-fila" onClick={() => aprobar(p)}><CheckCircle2 size={15} /> Asignar</button>
                      </div>
                    )}
                    {rechazoId === p.id && (
                      <RechazoPostulacion postulacion={p} onCancelar={() => setRechazoId(null)}
                        onHecho={() => { setRechazoId(null); onCambio(); cargar() }} />
                    )}
                  </li>
                ))}
              </ul>
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

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const CAMPOS_CURSO = [
  ['sede', 'Sede'], ['programa', 'Programa'], ['plan', 'Plan'], ['nivel', 'Nivel'],
  ['codigo', 'Código *'], ['grupo', 'Grupo'], ['curso', 'Curso *'], ['agrupamiento', 'Agrupamiento'],
  ['jornada', 'Jornada'], ['creditos', 'Créditos'], ['horas_semana', 'H. semana'], ['espacio', 'Espacio'],
]

// Crear (curso = null) o editar un curso de la programación. El profesor se
// puede escribir o elegir de la base de profesores.
function CursoModal({ curso, periodoPorDefecto, profesores, catalogos, onClose, onGuardado }) {
  const sugeridos = usePeriodosSugeridos()
  // Perfil del curso (requerimientos y años mínimos): va por código, aplica a todos sus grupos y periodos.
  // Sin tocarlo se muestra el guardado del código escrito; solo se guarda si se cambió.
  const [perfilEdit, setPerfilEdit] = useState(null)
  const [form, setForm] = useState(() => ({
    periodo: curso?.periodo || periodoPorDefecto || '',
    ...Object.fromEntries(CAMPOS_CURSO.map(([k]) => [k, curso?.[k] || ''])),
    profesor_nombre: curso?.profesor_nombre || '', profesor_documento: curso?.profesor_documento || '',
    profesor_correo: curso?.profesor_correo || '', vinculacion: curso?.vinculacion || '',
  }))
  const [horario, setHorario] = useState(() => (curso?.horario?.length ? curso.horario : [{ dia: '', hora: '', aula: '' }]))
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setH = (i, k) => (e) => setHorario(h => h.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))
  const listo = form.periodo.trim() && form.codigo.trim() && form.curso.trim()
  const codigoPerfil = form.codigo.trim().toUpperCase()
  const perfil = perfilEdit || catalogos.perfiles.find(p => p.codigo === codigoPerfil) || { req_anios: 0, requerimientos: [] }
  const setPerfil = (cambio) => setPerfilEdit({ req_anios: perfil.req_anios, requerimientos: perfil.requerimientos, ...cambio })

  const elegirProfesor = (e) => {
    const p = profesores.find(x => String(x.id) === e.target.value)
    if (p) setForm(f => ({ ...f, profesor_nombre: p.nombre, profesor_documento: p.documento, profesor_correo: p.correo, vinculacion: p.vinculacion || '' }))
  }
  const sinProfesor = () => setForm(f => ({ ...f, profesor_nombre: '', profesor_documento: '', profesor_correo: '', vinculacion: '' }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const datos = { ...form, horario: horario.filter(h => h.dia || h.hora || h.aula) }
      // Cruce de profesor o de aula: no se guarda (el servidor también lo impide).
      // Posible cruce de grupo: se advierte y se puede guardar igual.
      if (datos.horario.length) {
        const sim = await simularCruces({ ...datos, id: curso?.id }).catch(() => null)
        if (sim?.cruces.length) {
          const otra = (c) => sim.sesionesRelacionadas.find(s => c.sesiones.includes(s.id))
          const lineas = (lista) => lista.slice(0, 6).map(c => {
            const o = otra(c)
            return `• ${TIPO_CRUCE[c.tipo]} ${c.dia} ${c.inicio}–${c.fin}: ${o ? `${o.codigo} ${o.curso} (G${o.grupo || '—'})` : 'otro curso'} · ${c.etiqueta}`
          }).join('\n') + (lista.length > 6 ? '\n…' : '')
          const bloquean = sim.cruces.filter(c => c.tipo === 'profesor' || c.tipo === 'aula')
          if (bloquean.length) {
            alertError(`No se puede guardar: el horario se cruza (profesor o aula).\n${lineas(bloquean)}\n\nCambia el día, la hora, el aula o el profesor.`)
            setGuardando(false); return
          }
          const seguir = await confirmAccion({
            title: `Posible cruce de grupo (${sim.cruces.length})`,
            text: `${lineas(sim.cruces)}\n\n¿Guardar de todas formas?`,
            confirmButtonText: 'Guardar de todas formas',
          })
          if (!seguir) { setGuardando(false); return }
        }
      }
      const r = curso ? await actualizarCurso(curso.id, datos) : await crearCurso(datos)
      if (perfilEdit) await guardarPerfilCurso(codigoPerfil, perfilEdit)
      toastExito(curso ? 'Curso actualizado' : 'Curso creado')
      onGuardado(r.periodo)
      onClose()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  const cambiaProfesor = curso && curso.profesor_nombre && (
    form.profesor_nombre !== curso.profesor_nombre || form.profesor_documento.replace(/\D/g, '') !== curso.profesor_documento)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !guardando && onClose()}>
      <form className="modal-box asignia-modal asignia-modal-post" role="dialog" aria-modal="true" aria-labelledby="asignia-curso-titulo" onSubmit={guardar}>
        <div className="modal-header">
          <h3 id="asignia-curso-titulo">{curso ? 'Editar curso' : 'Nuevo curso'}</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={guardando} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form">
          <h4 className="modal-section-title">Datos del curso</h4>
          <div className="asignia-form-grid">
            <div className="modal-field">
              <label htmlFor="cur-periodo">Periodo *</label>
              <input id="cur-periodo" type="text" maxLength={20} required disabled={Boolean(curso)} value={form.periodo} onChange={set('periodo')} placeholder="Ej. 2027-1" list="asignia-periodos-curso" />
              <ListaPeriodos id="asignia-periodos-curso" periodos={sugeridos} />
            </div>
            {CAMPOS_CURSO.map(([k, label]) => (
              <div key={k} className={`modal-field${['curso', 'programa', 'espacio'].includes(k) ? ' asignia-form-ancho' : ''}`}>
                <label htmlFor={`cur-${k}`}>{label}</label>
                <input id={`cur-${k}`} type="text" maxLength={200} required={k === 'codigo' || k === 'curso'} value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>

          <h4 className="modal-section-title">Días y horario</h4>
          <div className="asignia-horario-edit">
            {horario.map((h, i) => (
              <div key={i} className="asignia-horario-fila">
                <select aria-label={`Día de la franja ${i + 1}`} value={h.dia} onChange={setH(i, 'dia')}>
                  <option value="">Día</option>
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="text" aria-label={`Hora de la franja ${i + 1}`} placeholder="08:00 - 10:00" maxLength={40} value={h.hora} onChange={setH(i, 'hora')} />
                <input type="text" aria-label={`Aula de la franja ${i + 1}`} placeholder="Aula" maxLength={60} value={h.aula} onChange={setH(i, 'aula')} />
                <button type="button" className="btn-icon asignia-accion" aria-label={`Quitar franja ${i + 1}`}
                  onClick={() => setHorario(hs => hs.filter((_, j) => j !== i))}><X size={15} /></button>
              </div>
            ))}
            <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => setHorario(hs => [...hs, { dia: '', hora: '', aula: '' }])}>
              <Plus size={15} /> Agregar franja
            </button>
          </div>

          <h4 className="modal-section-title" id="cur-reqs-titulo">Perfil del curso{codigoPerfil ? ` ${codigoPerfil}` : ''}</h4>
          <p className="asignia-ayuda">Requerimientos y años de experiencia que pide el curso. Aplica a todos los grupos y periodos con este código. Un profesor es elegible si tiene al menos un requerimiento en común y los años mínimos.</p>
          <RequerimientosChecks id="cur-reqs-titulo" catalogo={catalogos.requerimientos} valor={perfil.requerimientos} onChange={(requerimientos) => setPerfil({ requerimientos })} />
          <div className="modal-field">
            <label htmlFor="cur-anios">Años mínimos de experiencia</label>
            <input id="cur-anios" type="number" min={0} max={80} step={1} value={perfil.req_anios}
              onChange={(e) => setPerfil({ req_anios: e.target.value === '' ? 0 : Number(e.target.value) })} />
          </div>

          <h4 className="modal-section-title">Profesor</h4>
          {profesores.length > 0 && (
            <div className="modal-field">
              <label htmlFor="cur-base">Elegir de la base de profesores</label>
              <select id="cur-base" value="" onChange={elegirProfesor}>
                <option value="">Selecciona para llenar los datos...</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.documento}</option>)}
              </select>
            </div>
          )}
          <div className="asignia-form-grid">
            <div className="modal-field asignia-form-ancho">
              <label htmlFor="cur-pnom">Nombre</label>
              <input id="cur-pnom" type="text" maxLength={150} value={form.profesor_nombre} onChange={set('profesor_nombre')} placeholder="Vacío = curso sin profesor" />
            </div>
            <div className="modal-field">
              <label htmlFor="cur-pdoc">Documento</label>
              <input id="cur-pdoc" type="text" inputMode="numeric" maxLength={20} required={Boolean(form.profesor_nombre.trim())} value={form.profesor_documento} onChange={set('profesor_documento')} />
            </div>
            <div className="modal-field">
              <label htmlFor="cur-pvin">Vinculación</label>
              <input id="cur-pvin" type="text" maxLength={100} value={form.vinculacion} onChange={set('vinculacion')} />
            </div>
            <div className="modal-field asignia-form-ancho">
              <label htmlFor="cur-pcor">Correo institucional</label>
              <input id="cur-pcor" type="email" maxLength={150} required={Boolean(form.profesor_nombre.trim())} value={form.profesor_correo} onChange={set('profesor_correo')} />
            </div>
          </div>
          {form.profesor_nombre && (
            <button type="button" className="btn-secondary asignia-btn-fila asignia-btn-peligro asignia-btn-solo" onClick={sinProfesor}><X size={15} /> Dejar sin profesor</button>
          )}
          <p className="asignia-ayuda">
            {curso
              ? (cambiaProfesor
                ? 'Cambiaste el profesor: el curso quedará "Por responder" hasta que el nuevo profesor lo acepte o rechace. Se pierde la respuesta anterior.'
                : 'Si no cambias el profesor, el curso conserva su estado de verificación.')
              : 'Con profesor el curso queda "Por responder" (el profesor lo acepta o rechaza); sin profesor queda "Disponible" para postulaciones.'}
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={!listo || guardando}>
            <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Crear (profesor = null) o editar un profesor de la base.
function ProfesorModal({ profesor, catalogos, onClose, onGuardado }) {
  const [form, setForm] = useState({
    documento: profesor?.documento || '', nombre: profesor?.nombre || '',
    correo: profesor?.correo || '', vinculacion: profesor?.vinculacion || '',
    url_imagen_perfil: profesor?.url_imagen_perfil || '', anios_experiencia: profesor?.anios_experiencia ?? 0,
    nivel_academico_id: profesor?.nivel_academico_id ? String(profesor.nivel_academico_id) : '',
    requerimientos: profesor?.requerimientos || [],
    induccion_realizada: Boolean(profesor?.induccion_realizada),
    calificacion_sicau: profesor?.calificacion_sicau ?? '',
    celular: profesor?.celular || '',
    fecha_expedicion_cedula: profesor?.fecha_expedicion_cedula || '',
  })
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const listo = form.documento.trim() && form.nombre.trim() && form.correo.trim()

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (profesor) await actualizarProfesor(profesor.id, form)
      else await crearProfesor(form)
      toastExito(profesor ? 'Profesor actualizado' : 'Profesor creado')
      onGuardado()
      onClose()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !guardando && onClose()}>
      <form className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-prof-titulo" onSubmit={guardar}>
        <div className="modal-header">
          <h3 id="asignia-prof-titulo">{profesor ? 'Editar profesor' : 'Nuevo profesor'}</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={guardando} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form">
          <p className="asignia-ayuda">Con documento y correo el profesor puede entrar a la pantalla pública de Mi cátedra y postularse.</p>
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="prof-doc">Documento</label>
              <input id="prof-doc" type="text" inputMode="numeric" maxLength={20} required autoFocus
                value={form.documento} onChange={set('documento')} placeholder="Sin puntos ni espacios" />
            </div>
            <div className="modal-field">
              <label htmlFor="prof-vin">Vinculación (opcional)</label>
              <input id="prof-vin" type="text" maxLength={100} value={form.vinculacion} onChange={set('vinculacion')} placeholder="Ej. Cátedra, Planta" />
            </div>
          </div>
          <div className="modal-field">
            <label htmlFor="prof-nom">Nombre completo</label>
            <input id="prof-nom" type="text" maxLength={150} required value={form.nombre} onChange={set('nombre')} />
          </div>
          <div className="modal-field">
            <label htmlFor="prof-cor">Correo institucional</label>
            <input id="prof-cor" type="email" maxLength={150} required value={form.correo} onChange={set('correo')} placeholder="nombre@pascualbravo.edu.co" />
          </div>
          {profesor && (
            <p className="asignia-ayuda">Cambiar documento o correo no modifica los cursos ya asignados con los datos anteriores.</p>
          )}

          <h4 className="modal-section-title">Perfil</h4>
          <div className="asignia-perfil-cab">
            <AvatarProfesor url={form.url_imagen_perfil.trim()} nombre={form.nombre} tamano={56} />
            <div className="modal-field" style={{ flex: 1 }}>
              <label htmlFor="prof-img">Enlace de la imagen de perfil (opcional)</label>
              <input id="prof-img" type="url" maxLength={500} value={form.url_imagen_perfil} onChange={set('url_imagen_perfil')} placeholder="https://..." />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="prof-anios">Años de experiencia</label>
              <input id="prof-anios" type="number" min={0} max={80} step={1} value={form.anios_experiencia} onChange={set('anios_experiencia')} />
            </div>
            <div className="modal-field">
              <label htmlFor="prof-nivel">Nivel académico</label>
              <select id="prof-nivel" value={form.nivel_academico_id} onChange={set('nivel_academico_id')}>
                <option value="">Sin nivel</option>
                {catalogos.niveles.map(n => <option key={n.id} value={n.id}>{n.nombre} ({n.min_horas}–{n.max_horas} h)</option>)}
              </select>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="prof-celular">Número celular (opcional)</label>
              <input id="prof-celular" type="tel" inputMode="numeric" maxLength={15} value={form.celular} onChange={set('celular')} placeholder="3001234567" />
            </div>
            <div className="modal-field">
              <label htmlFor="prof-fechacedula">Fecha de expedición de la cédula (opcional)</label>
              <input id="prof-fechacedula" type="date" value={form.fecha_expedicion_cedula} onChange={set('fecha_expedicion_cedula')} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="prof-sicau">Calificación profesoral SICAU (opcional)</label>
              <input id="prof-sicau" type="number" min={0} max={100} step="0.01" value={form.calificacion_sicau}
                onChange={set('calificacion_sicau')} placeholder="Último semestre calificado" />
            </div>
            <div className="modal-field">
              <span className="asignia-ayuda">Inducción institucional</span>
              <label className="cal-config-check" htmlFor="prof-induccion">
                <input id="prof-induccion" type="checkbox" checked={form.induccion_realizada}
                  onChange={(e) => setForm(f => ({ ...f, induccion_realizada: e.target.checked }))} />
                Ya realizó la inducción
              </label>
            </div>
          </div>
          <p id="prof-reqs-titulo" className="asignia-ayuda">Requerimientos técnicos/profesionales que cumple (el profesor también puede marcarlos con su nivel desde su pantalla):</p>
          <RequerimientosChecks id="prof-reqs-titulo" catalogo={catalogos.requerimientos} valor={form.requerimientos}
            onChange={(requerimientos) => setForm(f => ({ ...f, requerimientos }))} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={!listo || guardando}>
            <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ProfesoresTab({ profesores, carga, periodo, puedeEditar, onCambio, nuevo, onNuevoCerrado, catalogos, redacto }) {
  const [editando, setEditando] = useState(null) // null | 'nuevo' | profesor
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  // Cartas de carga mínima del periodo por documento (generada / gestionada).
  const [cartas, setCartas] = useState({})
  useEffect(() => {
    if (!periodo) return
    listarSolicitudesHoras(periodo).then(l => setCartas(Object.fromEntries(l.map(c => [c.documento, c])))).catch(() => {})
  }, [periodo])

  // Base de profesores con su carga (cursos y horas) del periodo mostrado.
  const filas = useMemo(() => profesores.map(p => {
    const c = carga[claveProfesor(p.documento, p.nombre)] || { horas: 0, cursos: 0 }
    const nivel = p.nivel_nombre ? { nombre: p.nivel_nombre, min_horas: p.min_horas, max_horas: p.max_horas } : null
    return { ...p, cursos: c.cursos, horas: fmtHoras(c.horas), horasNum: c.horas, nivel, alerta: alertaHoras(c.horas, nivel) }
  }), [profesores, carga])

  const [rapido, setRapido] = useState(null)
  const base = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const cumple = RAPIDOS.find(r => r.v === rapido)?.cumple
    return filas
      .filter(p => !q || [p.documento, p.nombre, p.correo, p.vinculacion, p.celular].some(v => (v || '').toLowerCase().includes(q)))
      .filter(p => !cumple || cumple(p))
  }, [filas, busqueda, rapido])
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(base, COL_GETTERS_PROF, () => setPage(1))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const visibles = filtered.slice((page - 1) * perPage, page * perPage)

  const quitar = async (p) => {
    const ok = await confirmAccion({
      title: '¿Quitar al profesor?',
      text: `${p.nombre} (${p.documento}) saldrá de la base de profesores. Sus cursos y postulaciones del periodo no cambian; si no tiene ninguno, ya no podrá entrar a la pantalla pública.`,
      icon: 'warning',
      confirmButtonText: 'Sí, quitar',
    })
    if (!ok) return
    try {
      await borrarProfesor(p.id)
      toastExito('Profesor quitado')
      onCambio()
    } catch (e) { alertError(e.message) }
  }

  const modal = (editando || nuevo) && (
    <ProfesorModal profesor={editando || null} catalogos={catalogos} onClose={() => { setEditando(null); onNuevoCerrado() }} onGuardado={onCambio} />
  )

  if (!profesores.length) {
    return (
      <div className="asignia-vacio">
        <p>Aún no hay base de profesores. Usa "Traer de la programación" para registrar los profesores de los cursos cargados, o "Cargar profesores" para subir el Excel (pestaña "BD Profesores"; "Formato guía" trae un ejemplo){puedeEditar ? ' o "Nuevo profesor" para crearlos uno por uno.' : '.'}</p>
        {modal}
      </div>
    )
  }

  return (
    <>
      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" placeholder="Buscar documento, nombre, correo, celular o vinculación..."
            value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1) }} aria-label="Buscar profesor" />
        </div>
        {anyFilter && <button className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
        <ExportMenu title="Mi cátedra profesores" columns={COLUMNAS_PROF_EXPORT} rows={filtered} allRows={filas} />
        <span className="results-count">{filtered.length} profesor{filtered.length !== 1 ? 'es' : ''}</span>
      </div>
      <div className="asignia-rapidos" role="group" aria-label="Ver solo">
        <span className="asignia-dato">Ver solo:</span>
        {RAPIDOS.map(r => (
          <button key={r.v} type="button" className={`asignia-rapido${rapido === r.v ? ' activo' : ''}`} aria-pressed={rapido === r.v}
            onClick={() => { setRapido(x => (x === r.v ? null : r.v)); setPage(1) }}>
            {r.label} · {filas.filter(r.cumple).length}
          </button>
        ))}
      </div>
      <div className="table-wrapper">
        <table className="data-table asignia-tabla asignia-tabla-prof">
          <thead>
            <tr>
              <th><ColumnFilter label="Profesor" {...colProps('nombre')} /></th>
              <th><ColumnFilter label={`Carga ${periodo || ''}`} {...colProps('nivel')} /></th>
              <th><ColumnFilter label="Inducción" {...colProps('induccion')} /></th>
              <th><ColumnFilter label="SICAU" {...colProps('sicau')} /></th>
              <th>Habilidades</th>
              <th className="asignia-col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr><td colSpan={6} className="asignia-sin-filas">No hay profesores con estos filtros.</td></tr>
            ) : visibles.map(p => (
              <tr key={p.id}>
                <td data-label="Profesor">
                  <div className="asignia-prof-celda">
                    <AvatarProfesor url={p.url_imagen_perfil} nombre={p.nombre} tamano={44} ampliable />
                    <div className="asignia-celda">
                      <strong>{p.nombre}</strong>
                      <span className="asignia-dato asignia-prof-datos">
                        <CopiarDato texto={p.documento} etiqueta="Documento" />
                        {p.correo && <CopiarDato texto={p.correo} etiqueta="Correo" />}
                        {p.celular && <CopiarDato texto={p.celular} etiqueta="Celular" />}
                        {p.vinculacion && <span>{p.vinculacion}</span>}
                        {p.fecha_expedicion_cedula && <span>Cédula exp. {fmtFechaCorta(p.fecha_expedicion_cedula)}</span>}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="Carga">
                  <BarraCarga horas={p.horasNum} cursos={p.cursos} nivel={p.nivel} alerta={p.alerta} />
                  <AlertaHoras soloCarta nivel={p.nivel} horas={p.horasNum} alerta={p.alerta} profesor={p}
                    solicitud={periodo ? { periodo, redacto, carta: cartas[p.documento], onCarta: (c) => setCartas(m => ({ ...m, [c.documento]: c })) } : null} />
                </td>
                <td data-label="Inducción">
                  {p.induccion_realizada
                    ? <span className="asignia-ok-texto"><CheckCircle2 size={15} aria-hidden="true" /> Realizada</span>
                    : <span className="asignia-pend-texto">Pendiente</span>}
                </td>
                <td data-label="SICAU">{p.calificacion_sicau != null ? <strong>{p.calificacion_sicau}</strong> : <span className="asignia-dato">Sin registrar</span>}</td>
                <td data-label="Habilidades"><HabilidadesProfesor habilidades={p.habilidades} /></td>
                <td data-label="Acciones" className="asignia-col-acciones">
                  <div className="asignia-acciones">
                    <VerInduccion profesor={p} icono />
                    {periodo && <VerCalificacion profesor={p} periodo={periodo} icono />}
                    {puedeEditar && (
                      <>
                        <button className="btn-icon asignia-accion asignia-tip" onClick={() => setEditando(p)}
                          data-tip="Editar profesor" aria-label={`Editar a ${p.nombre}`}><Pencil size={15} /></button>
                        <button className="btn-icon asignia-accion asignia-btn-peligro asignia-tip" onClick={() => quitar(p)}
                          data-tip="Quitar de la base de profesores" aria-label={`Quitar a ${p.nombre}`}><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1) }} />
      {modal}
    </>
  )
}

export default function AsigniaAdmin() {
  // Permisos por capacidad (se combinan en el rol): asignia_view ver · asignia_load cargar/editar ·
  // asignia_postulaciones decidir postulaciones y liberar · asignia_config configuración · asignia_manage todo.
  const { permissions, profile } = usePermissions()
  const codigos = new Set((permissions?.modules || []).flatMap(m => m.submodules.map(s => s.submodule_code)))
  const todo = codigos.has('asignia_manage')
  const puedeDecidir = todo || codigos.has('asignia_postulaciones')
  const puedeCargar = todo || codigos.has('asignia_load')
  const puedeConfig = todo || codigos.has('asignia_config')
  const [tab, setTab] = useState('programacion')
  const [data, setData] = useState(null) // null = cargando
  const [profesores, setProfesores] = useState([])
  const [periodo, setPeriodo] = useState('')
  const [estado, setEstado] = useState('')
  const [sede, setSede] = useState('')
  const [jornada, setJornada] = useState('')
  const [horarioF, setHorarioF] = useState({ dia: '', franja: '', horas: '' }) // día, franja y horas por semana
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [cargaAbierta, setCargaAbierta] = useState(null) // 'programacion' | 'profesores'
  const [postCurso, setPostCurso] = useState(null)
  const [cursoEdit, setCursoEdit] = useState(null) // null | 'nuevo' | curso
  const [profNuevo, setProfNuevo] = useState(false)
  const [resumenSinc, setResumenSinc] = useState(null) // resultado de "Traer de la programación"

  const cargar = useCallback((p) => listarCursosAsignia(p)
    .then((r) => { setData(r); setPeriodo(r.periodo || '') })
    .catch((e) => { setData({ periodo: null, periodos: [], cursos: [] }); alertError(e.message) }), [])

  const cargarProfes = useCallback(() => listarProfesores()
    .then(setProfesores)
    .catch((e) => alertError(e.message)), [])

  // Catálogos de Mi cátedra: requerimientos, niveles académicos y perfiles de curso (por código).
  const [catalogos, setCatalogos] = useState({ requerimientos: [], niveles: [], perfiles: [] })
  const cargarCatalogos = useCallback(() => Promise.all([listarRequerimientos(), listarNiveles(), listarPerfilesCurso()])
    .then(([requerimientos, niveles, perfiles]) => setCatalogos({ requerimientos, niveles, perfiles }))
    .catch((e) => alertError(e.message)), [])

  useEffect(() => { cargar(); cargarProfes(); cargarCatalogos() }, [cargar, cargarProfes, cargarCatalogos])

  const carga = useMemo(() => cargaPorProfesor(data?.cursos || []), [data])
  // Nivel académico de cada profesor de la base, por documento (alerta de horas en Programación).
  const nivelPorDoc = useMemo(() => Object.fromEntries(profesores.filter(p => p.nivel_nombre)
    .map(p => [p.documento, { nombre: p.nivel_nombre, min_horas: p.min_horas, max_horas: p.max_horas }])), [profesores])
  // Cada curso con las horas acumuladas de su profesor en el periodo y su alerta de nivel.
  const cursos = useMemo(() => (data?.cursos || []).map(c => {
    const k = claveProfesor(c.profesor_documento, c.profesor_nombre)
    const horas = carga[k]?.horas || 0
    const nivel = nivelPorDoc[c.profesor_documento] || null
    return { ...c, horas_profesor: k ? fmtHoras(horas) : null, nivel_profesor: nivel, alerta_horas: k ? alertaHoras(horas, nivel) : null }
  }), [data, carga, nivelPorDoc])
  const conteo = useMemo(() => {
    const c = {}
    cursos.forEach(x => { c[x.verificacion] = (c[x.verificacion] || 0) + 1 })
    return c
  }, [cursos])
  const sedes = useMemo(() => [...new Set(cursos.map(c => c.sede).filter(Boolean))].sort(), [cursos])
  const jornadas = useMemo(() => [...new Set(cursos.map(c => c.jornada).filter(Boolean))].sort(), [cursos])
  const horasOpciones = useMemo(() => horasDistintas(cursos), [cursos])
  const setH = (k) => (e) => { setHorarioF(x => ({ ...x, [k]: e.target.value })); setPage(1) }

  const baseFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cursos.filter(c =>
      (!estado || c.verificacion === estado) &&
      (!sede || c.sede === sede) &&
      (!jornada || c.jornada === jornada) &&
      cumpleHorario(c, horarioF) &&
      (!q || [c.codigo, c.curso, c.programa, c.grupo, c.sede, c.profesor_nombre, c.profesor_documento, c.profesor_correo]
        .some(v => (v || '').toLowerCase().includes(q))))
  }, [cursos, estado, sede, jornada, horarioF, busqueda])
  const { filtered: filtrados, colProps, anyFilter, clearFilters } = useColumnFilters(baseFiltrada, COL_GETTERS, () => setPage(1))

  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage))
  const visibles = filtrados.slice((page - 1) * perPage, page * perPage)

  const hayFiltros = anyFilter || estado || sede || jornada || busqueda || Object.values(horarioF).some(Boolean)
  const limpiarTodo = () => { clearFilters(); setEstado(''); setSede(''); setJornada(''); setHorarioF({ dia: '', franja: '', horas: '' }); setBusqueda(''); setPage(1) }
  const cambiarPeriodo = (p) => { setData(null); setPage(1); setSede(''); setJornada(''); setHorarioF({ dia: '', franja: '', horas: '' }); cargar(p) }

  // Registra en la pestaña Profesores a los de la programación ya cargada del periodo.
  const traerProfesores = async () => {
    const ok = await confirmAccion({
      title: '¿Traer los profesores de la programación?',
      text: `Se registran en esta pestaña los profesores de los cursos del periodo ${data.periodo}, identificados por documento. Si ya existen se actualizan sus datos; un dato vacío no borra lo guardado.`,
      icon: 'question',
      confirmButtonText: 'Sí, traerlos',
    })
    if (!ok) return
    try {
      setResumenSinc(await sincronizarProfesores(data.periodo))
      cargarProfes()
    } catch (e) { alertError(e.message) }
  }

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
      text: `${c.codigo} ${c.curso} (grupo ${c.grupo || '—'}) quedará vacante${c.profesor_nombre ? ` y ${c.profesor_nombre} dejará de tenerlo asignado` : ''}. Volverá a aparecer como disponible para que cualquier profesor se postule. Las postulaciones pendientes se descartarán.`,
      confirmButtonText: 'Sí, liberar',
    })
    if (!ok) return
    try {
      await liberarCurso(c.id)
      toastExito('Curso liberado')
      cargar(periodo)
    } catch (e) { alertError(e.message) }
  }

  const borrar = async (c) => {
    const ok = await confirmAccion({
      title: '¿Borrar el curso?',
      text: `${c.codigo} ${c.curso} (grupo ${c.grupo || '—'}) saldrá de la programación ${c.periodo}${c.profesor_nombre ? `, junto con la asignación a ${c.profesor_nombre}` : ''} y sus postulaciones. Si vuelve a venir en el Excel se creará de nuevo.`,
      icon: 'warning',
      confirmButtonText: 'Sí, borrar',
    })
    if (!ok) return
    try {
      await borrarCurso(c.id)
      toastExito('Curso borrado')
      cargar(periodo)
    } catch (e) { alertError(e.message) }
  }

  const esProf = tab === 'profesores'
  // Pestañas sin botones de carga en el encabezado.
  const esCal = ['calendario', 'postulaciones', 'configuracion', 'tutor'].includes(tab)

  return (
    <div className="sync-page estilo-hub asignia-page">
      <div className="sync-page-header">
        <div>
          <h2>Mi cátedra</h2>
          <p className="asignia-sub">Programación académica del semestre y verificación de la asignación de profesores.</p>
        </div>
        <div className="asignia-header-acciones">
          <button className="btn-secondary" onClick={copiarEnlace} title={ENLACE_PROFESORES}><Link2 size={15} /> Copiar enlace para profesores</button>
          {!esCal && <a className="btn-secondary" href={esProf ? FORMATO_PROFESORES : FORMATO_PROGRAMACION} download><Download size={15} /> Formato guía</a>}
          {puedeCargar && !esCal && (esProf ? (
            <>
              {data?.periodo && <button className="btn-secondary" onClick={traerProfesores}><RefreshCw size={15} /> Traer de la programación</button>}
              <button className="btn-secondary" onClick={() => setProfNuevo(true)}><UserPlus size={15} /> Nuevo profesor</button>
            </>
          ) : (
            <button className="btn-secondary" onClick={() => setCursoEdit('nuevo')}><Plus size={15} /> Nuevo curso</button>
          ))}
          {puedeCargar && !esCal && (
            <button className="btn-primary" onClick={() => setCargaAbierta(tab)}>
              <Upload size={15} /> {esProf ? 'Cargar profesores' : 'Cargar programación'}
            </button>
          )}
        </div>
      </div>

      <nav className="section-nav" aria-label="Secciones de Mi cátedra">
        <button type="button" className={`section-nav-tab${tab === 'programacion' ? ' active' : ''}`} aria-current={tab === 'programacion' ? 'page' : undefined} onClick={() => setTab('programacion')}>
          <Table2 size={16} /> Programación
        </button>
        <button type="button" className={`section-nav-tab${tab === 'calendario' ? ' active' : ''}`} aria-current={tab === 'calendario' ? 'page' : undefined} onClick={() => setTab('calendario')}>
          <CalendarDays size={16} /> Calendario
        </button>
        <button type="button" className={`section-nav-tab${esProf ? ' active' : ''}`} aria-current={esProf ? 'page' : undefined} onClick={() => setTab('profesores')}>
          <GraduationCap size={16} /> Profesores ({profesores.length})
        </button>
        <button type="button" className={`section-nav-tab${tab === 'postulaciones' ? ' active' : ''}`} aria-current={tab === 'postulaciones' ? 'page' : undefined} onClick={() => setTab('postulaciones')}>
          <Inbox size={16} /> Postulaciones
        </button>
        <button type="button" className={`section-nav-tab${tab === 'tutor' ? ' active' : ''}`} aria-current={tab === 'tutor' ? 'page' : undefined} onClick={() => setTab('tutor')}>
          <GraduationCap size={16} /> Tutor Virtual
        </button>
        {puedeConfig && (
          <button type="button" className={`section-nav-tab${tab === 'configuracion' ? ' active' : ''}`} aria-current={tab === 'configuracion' ? 'page' : undefined} onClick={() => setTab('configuracion')}>
            <Settings size={16} /> Configuración
          </button>
        )}
      </nav>

      {tab === 'tutor' ? (
        <SolicitudesTutor puedeDecidir={puedeDecidir} />
      ) : esCal ? (
        !data?.periodo ? <div className="asignia-vacio"><p>Aún no hay programación cargada.</p></div>
          : tab === 'calendario' ? <AsigniaCalendario periodo={data.periodo} />
            : tab === 'postulaciones' ? <AsigniaPostulaciones periodo={data.periodo} puedeDecidir={puedeDecidir} onCambio={() => cargar(periodo)} />
              : puedeConfig ? <AsigniaConfiguracion periodo={data.periodo} puedeEditar={puedeConfig} onCatalogos={() => { cargarCatalogos(); cargarProfes(); cargar(periodo) }} /> : null
      ) : esProf ? (
        <ProfesoresTab profesores={profesores} carga={carga} periodo={data?.periodo} puedeEditar={puedeCargar} onCambio={() => { cargarProfes(); cargar(periodo) }}
          nuevo={profNuevo} onNuevoCerrado={() => setProfNuevo(false)} catalogos={catalogos} redacto={profile?.username || ''} />
      ) : data === null ? (
        <div className="loading-box"><span className="loader"></span>Cargando...</div>
      ) : !data.periodo ? (
        <div className="asignia-vacio">
          <p>Aún no hay programación cargada. Usa "Cargar programación" para subir el Excel del semestre ("Formato guía" trae un ejemplo){puedeCargar ? ' o "Nuevo curso" para crearlos uno por uno.' : '.'}</p>
        </div>
      ) : (
        <>
          <div className="asignia-estados" role="group" aria-label="Filtrar por verificación">
            <button type="button" className={`asignia-estado${!estado ? ' activo' : ''}`} aria-pressed={!estado} onClick={() => { setEstado(''); setPage(1) }}>
              <span className="asignia-estado-num">{cursos.length}</span><span>Todos</span>
            </button>
            {Object.entries(ESTADOS).map(([k, e]) => (
              <button key={k} type="button" className={`asignia-estado ${e.tarjeta}${estado === k ? ' activo' : ''}`} aria-pressed={estado === k} onClick={() => { setEstado(estado === k ? '' : k); setPage(1) }}>
                <span className="asignia-estado-num">{conteo[k] || 0}</span><span>{e.label}</span>
              </button>
            ))}
          </div>

          <div className="filters-bar asignia-filtros-lider">
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
            <select className="filter-select" value={horarioF.dia} onChange={setH('dia')} aria-label="Día de la semana">
              <option value="">Todos los días</option>
              {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={horarioF.franja} onChange={setH('franja')} aria-label="Horario">
              <option value="">Todo el horario</option>
              {FRANJAS.map(f => <option key={f.v} value={f.v}>{f.label}</option>)}
            </select>
            <select className="filter-select" value={horarioF.horas} onChange={setH('horas')} aria-label="Horas por semana">
              <option value="">Todas las horas</option>
              {horasOpciones.map(h => <option key={h} value={h}>{h} h/semana</option>)}
            </select>
            {hayFiltros && <button className="btn-secondary" onClick={limpiarTodo}>Limpiar filtros</button>}
            <ExportMenu title={`Mi cátedra ${data.periodo}`} columns={COLUMNAS_EXPORT} rows={filtrados} allRows={cursos} />
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
                          {c.profesor_documento ? <CopiarDato texto={c.profesor_documento} etiqueta="Documento" className="asignia-dato" /> : <span className="asignia-dato">Sin documento</span>}
                          {c.profesor_correo ? <CopiarDato texto={c.profesor_correo} etiqueta="Correo" className="asignia-dato asignia-correo" /> : <span className="asignia-dato">Sin correo</span>}
                          <Coincidencia m={c.coincidencia} compacto />
                        </div>
                      ) : '—'}
                    </td>
                    <td data-label="Horas profesor" title="Suma de horas semanales de los cursos asignados o aceptados del profesor en el periodo">
                      {c.horas_profesor === null ? '—' : (
                        <div className="asignia-celda">
                          <strong>{c.horas_profesor} h</strong>
                          {c.alerta_horas === 'minimo' && <span className="badge asignia-badge badge-novedad" title={`${c.nivel_profesor.nombre}: mínimo ${c.nivel_profesor.min_horas} h`}>Bajo el mínimo ({c.nivel_profesor.min_horas} h)</span>}
                          {c.alerta_horas === 'maximo' && <span className="badge asignia-badge badge-error" title={`${c.nivel_profesor.nombre}: máximo ${c.nivel_profesor.max_horas} h`}>Cupo alcanzado ({c.nivel_profesor.max_horas} h)</span>}
                        </div>
                      )}
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
                          <button className="btn-icon asignia-accion asignia-tip" onClick={() => setPostCurso(c.id)}
                            data-tip={`Ver postulaciones: ${c.postulaciones_pendientes} profesor(es) esperan respuesta`} aria-label={`Ver postulaciones (${c.postulaciones_pendientes} pendientes)`}>
                            <Users size={15} /><span className="asignia-accion-num">{c.postulaciones_pendientes}</span>
                          </button>
                        )}
                        {c.verificacion !== 'vacio' && puedeDecidir ? (
                          <button className="btn-icon asignia-accion asignia-btn-peligro asignia-tip" onClick={() => liberar(c)}
                            data-tip="Curso ocupado. Clic para liberarlo: se quita al profesor y queda vacante para que otros se postulen"
                            aria-label="Liberar curso: quitar al profesor y dejarlo vacante">
                            <UserMinus size={15} />
                          </button>
                        ) : c.verificacion !== 'vacio' ? (
                          <span className="btn-icon asignia-accion asignia-accion-estado asignia-tip" tabIndex={0}
                            data-tip="Curso ocupado: tiene profesor asignado"
                            aria-label="Curso ocupado">
                            <Lock size={15} />
                          </span>
                        ) : (
                          <span className="btn-icon asignia-accion asignia-accion-estado asignia-tip" tabIndex={0}
                            data-tip="Curso liberado (vacante): los profesores pueden postularse"
                            aria-label="Curso liberado (vacante)">
                            <LockOpen size={15} />
                          </span>
                        )}
                        {puedeCargar && (
                          <>
                            <button className="btn-icon asignia-accion asignia-tip" onClick={() => setCursoEdit(c)}
                              data-tip="Editar curso" aria-label={`Editar ${c.codigo} ${c.curso}`}><Pencil size={15} /></button>
                            <button className="btn-icon asignia-accion asignia-btn-peligro asignia-tip" onClick={() => borrar(c)}
                              data-tip="Borrar curso de la programación" aria-label={`Borrar ${c.codigo} ${c.curso}`}><Trash2 size={15} /></button>
                          </>
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
      {resumenSinc && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResumenSinc(null)}>
          <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-sinc-titulo">
            <div className="modal-header">
              <h3 id="asignia-sinc-titulo">Profesores de la programación {resumenSinc.periodo}</h3>
              <button className="modal-close" onClick={() => setResumenSinc(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-form"><ResumenProfesores r={resumenSinc} /></div>
            <div className="modal-actions"><button className="btn-primary" onClick={() => setResumenSinc(null)}>Listo</button></div>
          </div>
        </div>
      )}
      {cursoEdit && (
        <CursoModal curso={cursoEdit === 'nuevo' ? null : cursoEdit} periodoPorDefecto={periodo} profesores={profesores} catalogos={catalogos}
          onClose={() => setCursoEdit(null)} onGuardado={(p) => { cargar(p || periodo); cargarCatalogos() }} />
      )}
      {postCurso && (
        <PostulacionesModal cursoId={postCurso} puedeDecidir={puedeDecidir} onClose={() => setPostCurso(null)} onCambio={() => cargar(periodo)} />
      )}
    </div>
  )
}
