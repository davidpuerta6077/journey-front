import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, CheckCircle2, XCircle, Send, LogOut, ClipboardList, X, CalendarDays, Home, ClipboardCheck, ListChecks } from 'lucide-react'
import { AvatarProfesor, PerfilAplica, MisHabilidades, Ayuda, BarraCarga } from './PerfilProfesor'
import { tutorVirtualProfesor } from '../../../services/asignia/tutorVirtualProfesor'
import { solicitarTutor } from '../../../services/asignia/solicitarTutor'
import MiHorario from './calendario/MiHorario'
import { TONOS, ESTADO_POST, DIAS_SEMANA as DIAS, FRANJAS, cumpleHorario } from './asigniaUtil'
import { consultarProfesor } from '../../../services/asignia/consultarProfesor'
import { MiCalificacion } from './CalificacionSidem'
import { aceptarAsignacion } from '../../../services/asignia/aceptarAsignacion'
import { rechazarAsignacion } from '../../../services/asignia/rechazarAsignacion'
import { listarDisponibles } from '../../../services/asignia/listarDisponibles'
import { postularse } from '../../../services/asignia/postularse'
import '../../../styles/main/Sync/SyncMatriculas.css'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Asignia/Asignia.css'

// Colores y textos de estado: los mismos de toda Asignia (asigniaUtil.js).
const B = TONOS
const ESTADO_POSTULACION = ESTADO_POST

// Horas semanales de una lista de cursos (columna "H. Semana" de la programación).
const horasDe = (lista) => lista.reduce((t, c) => t + (Number(String(c.horas_semana || '').replace(',', '.')) || 0), 0)
const fmtH = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} h`

const SIN_FILTROS = { q: '', programa: '', sede: '', jornada: '', dia: '', franja: '', horas: '' }

const DESCRIPCION = 'Tu espacio de asignación académica, acepta las asignaciones de cursos para el siguiente semestre, consulta los cursos disponibles y selecciona tus preferencias.'

// Tutor Virtual: si no tiene el certificado, puede pedir matrícula al curso (llega al administrador).
function TutorVirtual({ ident }) {
  const [estado, setEstado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { tutorVirtualProfesor(ident).then(setEstado).catch(() => setEstado(false)) }, [ident])
  if (estado === null) return <span className="asignia-dato">Consultando…</span>
  if (estado?.certificado) return <span className="asignia-ok-texto"><CheckCircle2 size={16} aria-hidden="true" /> Certificado</span>
  if (!estado) return <span className="asignia-dato">No pudimos consultar tu certificado.</span>

  const solicitar = async () => {
    setEnviando(true)
    setError('')
    try {
      const s = await solicitarTutor(ident)
      setEstado(e => ({ ...e, solicitud: s }))
    } catch (e) { setError(e.message) }
    setEnviando(false)
  }

  return (
    <div className="asignia-celda" role="status">
      {estado.solicitud ? (
        <span>
          Matrícula{' '}
          <span className={`badge asignia-badge ${estado.solicitud.estado === 'matriculado' ? 'badge-synced' : 'badge-novedad'}`}>
            {estado.solicitud.estado === 'matriculado' ? 'Matriculado' : 'Pendiente'}
          </span>
        </span>
      ) : (
        <>
          <span className="asignia-dato">{estado.disponible ? 'Aún no tienes el certificado.' : 'No pudimos confirmar tu certificado.'}</span>
          <button className="btn-secondary asignia-btn-fila" onClick={solicitar} disabled={enviando}><Send size={15} /> {enviando ? 'Enviando...' : 'Solicitar matrícula'}</button>
        </>
      )}
      {error && <span className="public-form-error" role="alert">{error}</span>}
    </div>
  )
}

function cumpleFiltros(c, f) {
  const q = f.q.trim().toLowerCase()
  return (!f.programa || c.programa === f.programa)
    && (!f.sede || c.sede === f.sede)
    && (!f.jornada || c.jornada === f.jornada)
    && cumpleHorario(c, f)
    && (!q || [c.codigo, c.curso, c.programa].some(v => (v || '').toLowerCase().includes(q)))
}

function Badge({ e }) {
  return <span className={`badge asignia-badge ${e?.clase || ''}`}>{e?.label}</span>
}

function Horario({ horario }) {
  if (!horario?.length) return '—'
  return <div className="asignia-celda">{horario.map((h, i) => <span key={i} className="asignia-horario">{h.dia} {h.hora}{h.aula ? ` · ${h.aula}` : ''}</span>)}</div>
}

// Celdas comunes de un curso en las tablas del profesor.
function CeldasCurso({ c }) {
  return (
    <>
      <td data-label="Curso">
        <div className="asignia-celda">
          <span>{c.codigo} · {c.curso}</span>
          {(c.creditos || c.horas_semana) && <span className="asignia-dato">{[c.creditos && `${c.creditos} créditos`, c.horas_semana && `${c.horas_semana} h/semana`].filter(Boolean).join(' · ')}</span>}
          <span className="asignia-dato">{[c.grupo && `Grupo ${c.grupo}`, c.sede, c.jornada, c.espacio].filter(Boolean).join(' · ')}</span>
        </div>
      </td>
      <td data-label="Programa">
        <div className="asignia-celda">
          <span>{c.programa || '—'}</span>
          <span className="asignia-dato">Plan {c.plan || '—'}{c.nivel ? ` · Nivel ${c.nivel}` : ''}</span>
        </div>
      </td>
      <td data-label="Días y horario"><Horario horario={c.horario} /></td>
    </>
  )
}

// Estado + motivo (si lo hay) en una sola celda.
function CeldaEstado({ e, causal, motivo }) {
  return (
    <td data-label="Estado">
      <div className="asignia-celda">
        <Badge e={e} />
        {causal && <span className="asignia-dato">Motivo: {causal}</span>}
        {motivo && <span className="asignia-dato">"{motivo}"</span>}
      </div>
    </td>
  )
}

// Tabla de cursos. Con `seleccion` agrega la columna de checkbox.
function TablaCursos({ filas, vacio, seleccion, estado }) {
  const cols = seleccion ? 5 : 4
  return (
    <div className="table-wrapper">
      <table className="data-table asignia-tabla asignia-tabla-cursos">
        <thead>
          <tr>
            {seleccion && (
              <th className="asignia-col-check">
                <input type="checkbox" aria-label="Seleccionar todos" checked={seleccion.todos} disabled={!filas.length}
                  onChange={seleccion.toggleTodos} />
              </th>
            )}
            <th>Curso</th><th>Programa</th><th>Días y horario</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr><td colSpan={cols} className="asignia-sin-filas">{vacio}</td></tr>
          ) : filas.map(({ key, c, ...resto }) => (
            <tr key={key} className={seleccion?.sel.includes(c.id) ? 'asignia-fila-elegida' : undefined}>
              {seleccion && (
                <td data-label="Seleccionar" className="asignia-col-check">
                  <input type="checkbox" aria-label={`Seleccionar ${c.curso}`} checked={seleccion.sel.includes(c.id)} onChange={() => seleccion.toggle(c.id)}
                    disabled={Boolean(c.cruce)} title={c.cruce ? 'Se cruza con tu horario' : undefined} />
                </td>
              )}
              <CeldasCurso c={c} />
              {estado({ c, ...resto })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Selección de cursos (solo cuenta lo marcado que sigue en la lista).
function useSeleccion(lista) {
  const [marcados, setMarcados] = useState([])
  const sel = marcados.filter(id => lista.some(c => c.id === id))
  const todos = lista.length > 0 && lista.every(c => sel.includes(c.id))
  return {
    sel,
    todos,
    limpiar: () => setMarcados([]),
    toggle: (id) => setMarcados(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])),
    toggleTodos: () => setMarcados(todos ? [] : lista.map(c => c.id)),
  }
}

function Filtros({ f, setF, cursos, total, ocultarCruces }) {
  const [mas, setMas] = useState(false)
  const ocultos = ['programa', 'franja', 'horas', 'sede'].filter(k => f[k]).length
  const opciones = (campo) => [...new Set(cursos.map(c => c[campo]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }))
  const programas = useMemo(() => opciones('programa'), [cursos]) // eslint-disable-line react-hooks/exhaustive-deps
  const sedes = useMemo(() => opciones('sede'), [cursos]) // eslint-disable-line react-hooks/exhaustive-deps
  const jornadas = useMemo(() => opciones('jornada'), [cursos]) // eslint-disable-line react-hooks/exhaustive-deps
  const horas = useMemo(() => opciones('horas_semana').map(String), [cursos]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }))
  const activos = Object.values(f).some(Boolean)

  return (
    <div className="filters-bar asignia-filtros">
      <div className="filter-input-wrapper">
        <Search size={15} className="filter-icon" />
        <input className="filter-input" placeholder="Buscar curso, código o programa..." value={f.q} onChange={set('q')} aria-label="Buscar" />
      </div>
      <select className="filter-select" value={f.dia} onChange={set('dia')} aria-label="Día de la semana">
        <option value="">Todos los días</option>
        {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select className="filter-select" value={f.jornada} onChange={set('jornada')} aria-label="Jornada">
        <option value="">Todas las jornadas</option>
        {jornadas.map(j => <option key={j} value={j}>{j}</option>)}
      </select>
      <button type="button" className="btn-secondary asignia-btn-fila" aria-expanded={mas} onClick={() => setMas(m => !m)}>
        {mas ? 'Menos filtros' : `Más filtros${ocultos ? ` · ${ocultos}` : ''}`}
      </button>
      {ocultarCruces && (
        <label className="cal-config-check asignia-check-cruces">
          <input type="checkbox" checked={ocultarCruces.valor} onChange={(e) => ocultarCruces.set(e.target.checked)} />
          Ocultar los que se cruzan con mi horario
        </label>
      )}
      {mas && (
      <div className="asignia-filtros-mas">
      <select className="filter-select" value={f.programa} onChange={set('programa')} aria-label="Programa académico">
        <option value="">Todos los programas</option>
        {programas.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select className="filter-select" value={f.franja} onChange={set('franja')} aria-label="Horario">
        <option value="">Todo el horario</option>
        {FRANJAS.map(fr => <option key={fr.v} value={fr.v}>{fr.label}</option>)}
      </select>
      <select className="filter-select" value={f.horas} onChange={set('horas')} aria-label="Horas por semana">
        <option value="">Todas las horas</option>
        {horas.map(h => <option key={h} value={h}>{h} h/semana</option>)}
      </select>
      <select className="filter-select" value={f.sede} onChange={set('sede')} aria-label="Sede">
        <option value="">Todas las sedes</option>
        {sedes.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      </div>
      )}
      {activos && <button type="button" className="btn-secondary asignia-btn-fila" onClick={() => setF(SIN_FILTROS)}><X size={14} /> Limpiar filtros</button>}
      <span className="results-count">{total} curso{total !== 1 ? 's' : ''}</span>
    </div>
  )
}

// Modal de confirmación: muestra los cursos que se van a afectar antes de confirmar.
function ConfirmarModal({ titulo, texto, cursos, confirmar, peligro, onConfirmar, onClose, children, puedeConfirmar = true }) {
  const [enviando, setEnviando] = useState(false)
  const ejecutar = async () => {
    setEnviando(true)
    await onConfirmar()
    setEnviando(false)
  }
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !enviando && onClose()}>
      <div className="modal-box asignia-modal" role="dialog" aria-modal="true" aria-labelledby="asignia-confirmar-titulo">
        <div className="modal-header">
          <h3 id="asignia-confirmar-titulo">{titulo}</h3>
          <button className="modal-close" onClick={onClose} disabled={enviando} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-form">
          <p className="asignia-ayuda">{texto}</p>
          <ul className="asignia-lista-confirmar">
            {cursos.map(c => (
              <li key={c.id}><strong>{c.codigo} · {c.curso}</strong><span>Grupo {c.grupo || '—'} · {c.jornada} · {c.sede}</span></li>
            ))}
          </ul>
          {children}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={enviando}>Cancelar</button>
          <button className={peligro ? 'btn-secondary asignia-btn-peligro' : 'btn-primary'} onClick={ejecutar} disabled={enviando || !puedeConfirmar}>
            {enviando ? 'Enviando...' : confirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

function Ingreso({ onIngresar }) {
  const [documento, setDocumento] = useState('')
  const [correo, setCorreo] = useState('')
  const [fechaExpedicionCedula, setFechaExpedicionCedula] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const ident = { documento: documento.trim(), correo: correo.trim(), fecha_expedicion_cedula: fechaExpedicionCedula }
      onIngresar(ident, await consultarProfesor(ident))
    } catch (err) {
      setError(err.message)
    }
    setCargando(false)
  }

  return (
    <div className="asignia-ingreso">
      <h1>Mi cátedra</h1>
      <p className="asignia-ayuda">{DESCRIPCION}</p>
      <form className="modal-form" onSubmit={enviar}>
        {error && <div className="public-form-error" role="alert">{error}</div>}
        <div className="modal-field">
          <label htmlFor="asignia-doc">Número de documento</label>
          <input id="asignia-doc" inputMode="numeric" autoComplete="off" required value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Sin puntos ni espacios" />
        </div>
        <div className="modal-field">
          <label htmlFor="asignia-correo">Correo institucional</label>
          <input id="asignia-correo" type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre.apellido@pascualbravo.edu.co" />
        </div>
        <div className="modal-field">
          <label htmlFor="asignia-fecha-cedula">Fecha de expedición de la cédula</label>
          <input id="asignia-fecha-cedula" type="date" required value={fechaExpedicionCedula} onChange={(e) => setFechaExpedicionCedula(e.target.value)} />
        </div>
        <button className="btn-primary asignia-btn-ancho" type="submit" disabled={cargando}>{cargando ? 'Consultando...' : 'Consultar'}</button>
      </form>
    </div>
  )
}

// Cursos asignados pendientes: el profesor los acepta o rechaza.
function PorResponder({ ident, cursos, aceptadas, onHecho, onError }) {
  const s = useSeleccion(cursos)
  const [modal, setModal] = useState(null) // 'aceptar' | 'rechazar'
  const [motivo, setMotivo] = useState('')
  const seleccionados = cursos.filter(c => s.sel.includes(c.id))

  const responder = async () => {
    try {
      const r = modal === 'aceptar'
        ? await aceptarAsignacion(ident, s.sel)
        : await rechazarAsignacion(ident, s.sel, motivo.trim())
      s.limpiar()
      setMotivo('')
      setModal(null)
      onHecho(`${r.actualizados} curso(s) ${modal === 'aceptar' ? 'aceptado(s)' : 'rechazado(s)'}.`)
    } catch (e) {
      setModal(null)
      onError(e.message)
    }
  }

  return (
    <>
      <div className="asignia-barra">
        <p className="asignia-ayuda">Cursos que te asignaron y aún no respondes. Márcalos y acepta o rechaza la asignación.</p>
        <div className="asignia-header-acciones">
          <button className="btn-secondary asignia-btn-peligro" disabled={!s.sel.length} onClick={() => setModal('rechazar')}><XCircle size={15} /> Rechazar ({s.sel.length})</button>
          <button className="btn-primary" disabled={!s.sel.length} onClick={() => setModal('aceptar')}><CheckCircle2 size={15} /> Aceptar asignación ({s.sel.length}{s.sel.length ? ` · ${fmtH(horasDe(seleccionados))}` : ''})</button>
        </div>
      </div>
      <TablaCursos filas={cursos.map(c => ({ key: c.id, c }))} seleccion={s} vacio="No tienes cursos pendientes de respuesta con estos filtros."
        estado={() => <CeldaEstado e={B.responder} />} />

      {modal === 'aceptar' && (
        <ConfirmarModal titulo="Aceptar asignación" confirmar="Sí, acepto" cursos={seleccionados}
          texto={`Vas a aceptar ${seleccionados.length} curso(s), ${fmtH(horasDe(seleccionados))} semanales. Quedarías con ${fmtH(aceptadas + horasDe(seleccionados))} aceptadas. Después de aceptar no podrás cambiar la respuesta desde aquí.`}
          onConfirmar={responder} onClose={() => setModal(null)} />
      )}
      {modal === 'rechazar' && (
        <ConfirmarModal titulo="Rechazar asignación" confirmar="Sí, rechazo" peligro cursos={seleccionados}
          texto={`Vas a rechazar ${seleccionados.length} curso(s). El líder del programa verá tu respuesta.`}
          onConfirmar={responder} onClose={() => setModal(null)}>
          <div className="modal-field">
            <label htmlFor="asignia-motivo">Motivo (opcional)</label>
            <textarea id="asignia-motivo" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. cruce de horario" />
          </div>
        </ConfirmarModal>
      )}
    </>
  )
}

// Cursos sin profesor a los que el profesor aún no se ha postulado.
function Disponibles({ ident, nombre, cursos, carga, onHecho, onError }) {
  // Un curso que se cruza con uno que ya tienes no se puede seleccionar.
  const s = useSeleccion(cursos.filter(c => !c.cruce))
  const [modal, setModal] = useState(false)
  const [nombreEscrito, setNombreEscrito] = useState('')
  const seleccionados = cursos.filter(c => s.sel.includes(c.id))

  const postular = async () => {
    try {
      const r = await postularse(ident, s.sel, nombre || nombreEscrito.trim())
      s.limpiar()
      setModal(false)
      onHecho(`Te postulaste a ${r.postulados} curso(s). El líder revisará tu postulación; síguela en "En revisión".`)
    } catch (e) {
      setModal(false)
      onError(e.message)
    }
  }

  return (
    <>
      <p className="asignia-ayuda asignia-intro">
        Cursos sin profesor que aplican a tu perfil. Marca los que te interesan y envía tu postulación; el líder del programa decide la asignación.{' '}
        <Ayuda texto="Solo ves los cursos cuyos requerimientos coinciden con al menos una de tus habilidades y para los que tienes los años de experiencia que piden. En cada curso ves qué habilidades cumples y cuáles te faltan. Un curso que se cruza con tu horario no se puede marcar." />
      </p>
      <TablaCursos filas={cursos.map(c => ({ key: c.id, c }))} seleccion={s} vacio="No hay cursos disponibles con estos filtros."
        estado={({ c }) => (c.cruce
          ? (
            <td data-label="Estado">
              <div className="asignia-celda">
                <Badge e={{ ...B.rechazado, label: 'Se cruza con tu horario' }} />
                <span className="asignia-dato">"Con {c.cruce}"</span>
                <PerfilAplica m={c.coincidencia} />
              </div>
            </td>
          )
          : (
            <td data-label="Estado">
              <div className="asignia-celda">
                <PerfilAplica m={c.coincidencia} />
              </div>
            </td>
          ))} />
      <div className="asignia-barra-fija" role="region" aria-label="Postulación">
        <span>
          {s.sel.length
            ? <><strong>{s.sel.length} curso{s.sel.length !== 1 ? 's' : ''} elegido{s.sel.length !== 1 ? 's' : ''}</strong> · {fmtH(horasDe(seleccionados))} semanales{carga?.max ? ` · tu carga quedaría en ${fmtH(carga.horas + horasDe(seleccionados))} de ${fmtH(carga.max)}` : ''}
              {carga?.max > 0 && carga.horas + horasDe(seleccionados) > carga.max && (
                <span className="asignia-carga-texto asignia-carga-minimo"> · supera el máximo de tu nivel; el líder puede no aprobarlas todas</span>
              )}</>
            : 'Marca los cursos a los que te quieres postular.'}
        </span>
        <button className="btn-primary" disabled={!s.sel.length} onClick={() => setModal(true)}>
          <Send size={15} /> {s.sel.length ? `Postularme a ${s.sel.length} curso${s.sel.length !== 1 ? 's' : ''}` : 'Postularme'}
        </button>
      </div>

      {modal && (
        <ConfirmarModal titulo="Enviar postulación" confirmar="Sí, postularme" cursos={seleccionados}
          texto={`Te vas a postular a ${seleccionados.length} curso(s), ${fmtH(horasDe(seleccionados))} semanales. Pueden postularse varios profesores al mismo curso; el líder elige.`}
          onConfirmar={postular} onClose={() => setModal(false)} puedeConfirmar={Boolean(nombre || nombreEscrito.trim())}>
          {!nombre && (
            <div className="modal-field">
              <label htmlFor="asignia-nombre">Tu nombre completo</label>
              <input id="asignia-nombre" maxLength={150} value={nombreEscrito} onChange={(e) => setNombreEscrito(e.target.value)} />
            </div>
          )}
        </ConfirmarModal>
      )}
    </>
  )
}

const VISTAS = [
  { v: 'responder', label: 'Por responder', clase: TONOS.responder.tarjeta },
  { v: 'aceptados', label: 'Aceptados', clase: TONOS.aceptado.tarjeta },
  { v: 'revision', label: 'En revisión', clase: TONOS.revision.tarjeta },
  { v: 'disponibles', label: 'Disponibles', clase: TONOS.disponible.tarjeta },
  { v: 'rechazados', label: 'Rechazados', clase: TONOS.rechazado.tarjeta },
]

// Tooltip de cada tarjeta de estado.
const AYUDA_ESTADO = {
  responder: 'Cursos que el líder te asignó y esperan que los aceptes o rechaces.',
  aceptados: 'Cursos que aceptaste o que te aprobaron por postulación.',
  revision: 'Postulaciones que el líder del programa todavía está revisando.',
  disponibles: 'Cursos sin profesor que aplican a tu perfil y a los que te puedes postular.',
  rechazados: 'Asignaciones que rechazaste y postulaciones que no quedaron.',
}

const AYUDA = {
  aceptados: 'Cursos que aceptaste o que te aprobaron por postulación.',
  revision: 'Postulaciones que el líder del programa todavía está revisando.',
  rechazados: 'Historial de asignaciones que rechazaste y postulaciones que no quedaron, con su motivo.',
  postulaciones: 'Todas tus postulaciones del periodo y en qué estado van.',
}

export default function AsigniaProfesor() {
  const [ident, setIdent] = useState(null)
  const [datos, setDatos] = useState(null)
  const [disponibles, setDisponibles] = useState(null)
  const [vista, setVista] = useState(null)
  const [f, setF] = useState(SIN_FILTROS)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [sinCruces, setSinCruces] = useState(false)

  const cargarDisponibles = useCallback((i) => listarDisponibles(i)
    .then(r => setDisponibles(r.cursos))
    .catch(e => { setDisponibles([]); setError(e.message) }), [])

  useEffect(() => { if (ident && datos?.periodo) cargarDisponibles(ident) }, [ident, datos?.periodo, cargarDisponibles])

  const recargar = useCallback(() => {
    consultarProfesor(ident).then(setDatos).catch(() => {})
    cargarDisponibles(ident)
  }, [ident, cargarDisponibles])

  const listas = useMemo(() => {
    if (!datos) return null
    const asig = (estado) => datos.asignados.filter(c => c.verificacion === estado)
    const post = (...estados) => datos.postulaciones.filter(p => estados.includes(p.postulacion_estado))
    return {
      responder: asig('asignado'),
      aceptados: asig('aceptado'),
      revision: post('pendiente'),
      // Los cursos a los que ya se postuló están en "En revisión" o "Rechazados".
      disponibles: (disponibles || []).filter(c => !c.ya_postulado),
      rechazadosAsig: asig('rechazado'),
      rechazadosPost: post('rechazada', 'descartada'),
    }
  }, [datos, disponibles])

  // Al entrar: "Por responder" si hay pendientes, si no "Disponibles".
  const vistaActual = vista || (listas?.responder.length ? 'responder' : 'disponibles')
  // Inicio = las pestañas por estado (listado de cursos); Mi horario y Mis postulaciones son vistas aparte.
  const esInicio = !['horario', 'postulaciones', 'calificacion', 'habilidades'].includes(vistaActual)

  const salir = () => { setIdent(null); setDatos(null); setDisponibles(null); setVista(null); setF(SIN_FILTROS); setError(''); setOk('') }
  const hecho = (msg) => { setError(''); setOk(msg); recargar() }
  const fallo = (msg) => { setOk(''); setError(msg) }
  const cambiarVista = (v) => { setVista(v); setOk(''); setError('') }

  if (!ident || !datos) {
    return (
      <div className="asignia-publica estilo-hub">
        <Ingreso onIngresar={(i, d) => { setIdent(i); setDatos(d) }} />
      </div>
    )
  }

  const filtrar = (lista) => lista.filter(c => cumpleFiltros(c, f))
  const conteo = {
    responder: listas.responder,
    aceptados: listas.aceptados,
    revision: listas.revision,
    disponibles: listas.disponibles,
    rechazados: [...listas.rechazadosAsig, ...listas.rechazadosPost],
  }
  const totalPosible = horasDe(listas.aceptados) + horasDe(listas.responder) + horasDe(listas.revision)

  // Filas de la vista actual (ya filtradas) para el contador de la barra de filtros.
  const filasVista = {
    responder: filtrar(listas.responder),
    aceptados: filtrar(listas.aceptados),
    revision: filtrar(listas.revision),
    disponibles: filtrar(listas.disponibles),
    rechazados: filtrar(conteo.rechazados),
    postulaciones: filtrar(datos.postulaciones),
  }[vistaActual] || []

  const todosLosCursos = [...datos.asignados, ...datos.postulaciones, ...(disponibles || [])]

  return (
    <div className="asignia-publica estilo-hub">
      <div className="asignia-publica-contenido">
        <div className="sync-page-header">
          <div>
            <h2>Mi cátedra</h2>
            <p className="asignia-sub">{DESCRIPCION}</p>
            <p className="asignia-sub">{datos.periodo ? `Programación académica ${datos.periodo}` : 'Aún no hay programación publicada.'}</p>
          </div>
          <div className="asignia-header-acciones">
            <div className="asignia-usuario" aria-label="Usuario">
              <AvatarProfesor url={datos.perfil?.url_imagen_perfil} nombre={datos.nombre} tamano={64} ampliable />
              <span>
                <strong>{datos.nombre || 'Profesor'}</strong>
                <span className="asignia-dato">{ident.correo.toLowerCase()}</span>
                {datos.perfil?.celular && <span className="asignia-dato">{datos.perfil.celular}</span>}
              </span>
            </div>
            <button className="btn-secondary" onClick={salir}><LogOut size={15} /> Salir</button>
          </div>
        </div>

        <section className="asignia-banda" aria-label="Tu perfil este semestre">
          <div>
            <span className="asignia-banda-etq">Tu carga
              {' '}<Ayuda texto="Horas semanales de tus cursos aceptados y por responder. Tu nivel académico define el rango de horas que puedes tener." /></span>
            <BarraCarga horas={datos.perfil?.horas || 0} cursos={listas.aceptados.length + listas.responder.length} nivel={datos.perfil?.nivel} alerta={datos.perfil?.alerta} />
          </div>
          <div>
            <span className="asignia-banda-etq">Si te aprueban lo pendiente
              {' '}<Ayuda texto="Suma las horas semanales de tus cursos aceptados, los que están por responder y las postulaciones en revisión." /></span>
            <span className="asignia-banda-num">{fmtH(totalPosible)}</span>
            <span className="asignia-dato">{fmtH(horasDe(listas.aceptados) + horasDe(listas.responder))} asignadas + {fmtH(horasDe(listas.revision))} en revisión</span>
          </div>
          <div>
            <span className="asignia-banda-etq">Tus habilidades</span>
            <span className="asignia-banda-num">{datos.perfil?.habilidades?.length || 0}</span>
            <button type="button" className="asignia-enlace" onClick={() => cambiarVista('habilidades')}>Editar habilidades y niveles</button>
          </div>
          <div>
            <span className="asignia-banda-etq">Tutor Virtual
              {' '}<Ayuda texto="Tutor Virtual es el curso de Moodle que certifica tu formación como tutor en entornos virtuales. Si no lo tienes, pide aquí tu matrícula y el administrador te inscribe." /></span>
            <TutorVirtual ident={ident} />
          </div>
        </section>

        {datos.periodo && (
          <nav className="section-nav" aria-label="Navegación del profesor">
            {[
              { v: 'inicio', label: 'Inicio', icono: <Home size={16} />, activo: esInicio, ir: () => cambiarVista(null) },
              { v: 'horario', label: 'Mi horario', icono: <CalendarDays size={16} />, activo: vistaActual === 'horario', ir: () => cambiarVista('horario') },
              { v: 'postulaciones', label: `Mis postulaciones (${datos.postulaciones.length})`, icono: <ClipboardList size={16} />, activo: vistaActual === 'postulaciones', ir: () => cambiarVista('postulaciones') },
              { v: 'calificacion', label: 'Mi seguimiento', icono: <ClipboardCheck size={16} />, activo: vistaActual === 'calificacion', ir: () => cambiarVista('calificacion'), ayuda: 'Seguimiento VISOR de tus cursos por periodo, de 0 a 100.' },
              { v: 'habilidades', label: `Mis habilidades (${datos.perfil?.habilidades?.length || 0})`, icono: <ListChecks size={16} />, activo: vistaActual === 'habilidades', ir: () => cambiarVista('habilidades'), ayuda: 'Marca tus habilidades y su nivel de 1 a 10: con ellas se calculan los cursos que aplican a tu perfil.' },
            ].map(n => (
              <button key={n.v} type="button" className={`section-nav-tab${n.activo ? ' active' : ''}`} aria-current={n.activo ? 'page' : undefined} onClick={n.ir}
                title={n.ayuda || ({ inicio: 'Tus cursos por estado: por responder, aceptados, en revisión, disponibles y rechazados.', horario: 'Tu horario semanal con los cursos que tienes y las postulaciones en revisión.', postulaciones: 'Todas tus postulaciones del periodo y en qué estado van.' })[n.v]}>
                {n.icono} {n.label}
              </button>
            ))}
          </nav>
        )}

        {datos.periodo && (
          <>
            {esInicio && (
            <div className="asignia-tabs-estado" role="group" aria-label="Cursos por estado">
              {VISTAS.map(t => (
                <button key={t.v} type="button" className={`asignia-tab-estado${vistaActual === t.v ? ' activo' : ''}`}
                  aria-pressed={vistaActual === t.v} onClick={() => cambiarVista(t.v)}
                  title={`${AYUDA_ESTADO[t.v]} ${fmtH(horasDe(conteo[t.v]))} semanales.`}>
                  {t.label} <strong>{t.v === 'disponibles' && disponibles === null ? '…' : conteo[t.v].length}</strong>
                </button>
              ))}
            </div>
            )}

            {error && <div className="public-form-error" role="alert">{error}</div>}
            {ok && <div className="asignia-ok" role="status">{ok}</div>}

            {vistaActual === 'horario' && <MiHorario ident={ident} nombre={datos.nombre} />}
            {vistaActual === 'calificacion' && <MiCalificacion ident={ident} />}
            {vistaActual === 'habilidades' && <MisHabilidades ident={ident} perfil={datos.perfil} onGuardado={recargar} />}
            {!['horario', 'calificacion', 'habilidades'].includes(vistaActual) && (
              <Filtros f={f} setF={setF} cursos={todosLosCursos} total={filasVista.length}
                ocultarCruces={vistaActual === 'disponibles' ? { valor: sinCruces, set: setSinCruces } : null} />
            )}

            {vistaActual === 'responder' && (
              <PorResponder ident={ident} cursos={filasVista} aceptadas={horasDe(listas.aceptados)} onHecho={hecho} onError={fallo} />
            )}
            {vistaActual === 'disponibles' && (disponibles === null
              ? <div className="loading-box"><span className="loader"></span>Cargando cursos disponibles...</div>
              : <Disponibles ident={ident} nombre={datos.nombre} cursos={sinCruces ? filasVista.filter(c => !c.cruce) : filasVista}
                  carga={{ horas: datos.perfil?.horas || 0, max: Number(datos.perfil?.nivel?.max_horas) || 0 }} onHecho={hecho} onError={fallo} />)}
            {vistaActual === 'aceptados' && (
              <>
                <p className="asignia-ayuda asignia-barra">{AYUDA.aceptados}</p>
                <TablaCursos filas={filasVista.map(c => ({ key: c.id, c }))} vacio="No tienes cursos aceptados con estos filtros."
                  estado={() => <CeldaEstado e={B.aceptado} />} />
              </>
            )}
            {vistaActual === 'revision' && (
              <>
                <p className="asignia-ayuda asignia-barra">{AYUDA.revision}</p>
                <TablaCursos filas={filasVista.map(p => ({ key: p.postulacion_id, c: p }))} vacio="No tienes postulaciones en revisión con estos filtros."
                  estado={() => <CeldaEstado e={B.revision} />} />
              </>
            )}
            {vistaActual === 'rechazados' && (
              <>
                <p className="asignia-ayuda asignia-barra">{AYUDA.rechazados}</p>
                <TablaCursos
                  filas={filasVista.map(c => (c.postulacion_id ? { key: `p${c.postulacion_id}`, c } : { key: `a${c.id}`, c }))}
                  vacio="No tienes cursos rechazados con estos filtros."
                  estado={({ c }) => (c.postulacion_id
                    ? <CeldaEstado e={{ ...ESTADO_POSTULACION[c.postulacion_estado], label: c.postulacion_estado === 'rechazada' ? 'Postulación rechazada' : 'No seleccionada' }} causal={c.causal} motivo={c.motivo} />
                    : <CeldaEstado e={{ ...B.rechazado, label: 'Rechazaste la asignación' }} motivo={c.motivo_rechazo} />)} />
              </>
            )}
            {vistaActual === 'postulaciones' && (
              <>
                <p className="asignia-ayuda asignia-barra">{AYUDA.postulaciones}</p>
                <TablaCursos filas={filasVista.map(p => ({ key: p.postulacion_id, c: p }))} vacio="No tienes postulaciones con estos filtros. Revisa 'Disponibles' para postularte."
                  estado={({ c }) => <CeldaEstado e={ESTADO_POSTULACION[c.postulacion_estado]} causal={c.causal} motivo={c.motivo} />} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
