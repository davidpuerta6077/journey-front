import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, Search, CheckCircle2, XCircle, Send, LogOut } from 'lucide-react'
import { consultarProfesor } from '../../../services/asignia/consultarProfesor'
import { aceptarAsignacion } from '../../../services/asignia/aceptarAsignacion'
import { rechazarAsignacion } from '../../../services/asignia/rechazarAsignacion'
import { listarDisponibles } from '../../../services/asignia/listarDisponibles'
import { postularse } from '../../../services/asignia/postularse'
import { ESTADOS } from './asigniaUtil'
import '../../../styles/main/Sync/SyncMatriculas.css'
import '../../../styles/main/Sync/SyncUsuariosP.css'
import '../../../styles/main/Asignia/Asignia.css'

const ESTADO_POSTULACION = {
  pendiente: { label: 'En revisión', clase: 'badge-syncing' },
  aprobada: { label: 'Aprobada', clase: 'badge-synced' },
  descartada: { label: 'No seleccionada', clase: 'badge-pending' },
  rechazada: { label: 'No seleccionada', clase: 'badge-pending' },
}

// Horas semanales de una lista de cursos (columna "H. Semana" de la programación).
const horasDe = (lista) => lista.reduce((t, c) => t + (Number(String(c.horas_semana || '').replace(',', '.')) || 0), 0)
const fmtH = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} h`

// Resumen de la carga horaria del profesor en el periodo.
function ResumenHoras({ datos }) {
  const aceptadas = horasDe(datos.asignados.filter(c => c.verificacion === 'aceptado'))
  const porResponder = horasDe(datos.asignados.filter(c => c.verificacion === 'asignado'))
  const postuladas = horasDe(datos.postulaciones.filter(p => p.postulacion_estado === 'pendiente'))
  const rechazadas = horasDe(datos.asignados.filter(c => c.verificacion === 'rechazado'))
  const items = [
    { label: 'Horas aceptadas', valor: aceptadas, tono: 'ok', ayuda: 'Cursos que ya aceptaste o que te aprobaron' },
    { label: 'Por responder', valor: porResponder, ayuda: 'Cursos asignados que aún no aceptas ni rechazas' },
    { label: 'En revisión', valor: postuladas, tono: 'revision', ayuda: 'Cursos a los que te postulaste y el líder está revisando' },
    { label: 'Rechazadas', valor: rechazadas, tono: 'error', ayuda: 'Cursos asignados que rechazaste' },
    { label: 'Total posible', valor: aceptadas + porResponder + postuladas, tono: 'total', ayuda: 'Si aceptas lo pendiente y te aprueban las postulaciones' },
  ]
  return (
    <div className="asignia-horas" role="group" aria-label="Tus horas semanales">
      {items.map(i => (
        <div key={i.label} className={`asignia-horas-item${i.tono ? ` asignia-horas-${i.tono}` : ''}`} title={i.ayuda}>
          <span className="asignia-estado-num">{fmtH(i.valor)}</span>
          <span>{i.label}</span>
          <span className="asignia-dato">{i.ayuda}</span>
        </div>
      ))}
    </div>
  )
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
        </div>
      </td>
      <td data-label="Grupo">{c.grupo || '—'}</td>
      <td data-label="Programa">
        <div className="asignia-celda">
          <span>{c.programa || '—'}</span>
          <span className="asignia-dato">Plan {c.plan || '—'}{c.nivel ? ` · Nivel ${c.nivel}` : ''}</span>
        </div>
      </td>
      <td data-label="Sede">{c.sede || '—'}</td>
      <td data-label="Jornada">
        <div className="asignia-celda">
          <span>{c.jornada || '—'}</span>
          {c.espacio && <span className="asignia-dato">{c.espacio}</span>}
        </div>
      </td>
      <td data-label="Días y horario"><Horario horario={c.horario} /></td>
    </>
  )
}

// Modal de aceptación: muestra los cursos que se van a afectar antes de confirmar.
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
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const ident = { documento: documento.trim(), correo: correo.trim() }
      onIngresar(ident, await consultarProfesor(ident))
    } catch (err) {
      setError(err.message)
    }
    setCargando(false)
  }

  return (
    <div className="asignia-ingreso">
      <h1>Asignia</h1>
      <p className="asignia-ayuda">Consulta los cursos que te asignaron para el semestre, acéptalos o recházalos, y postúlate a cursos sin profesor.</p>
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
        <button className="btn-primary asignia-btn-ancho" type="submit" disabled={cargando}>{cargando ? 'Consultando...' : 'Consultar'}</button>
      </form>
    </div>
  )
}

function MisCursos({ ident, datos, onCambio }) {
  const [marcados, setSel] = useState([])
  const [modal, setModal] = useState(null) // 'aceptar' | 'rechazar'
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const pendientes = datos.asignados.filter(c => c.verificacion === 'asignado')
  // Solo cuenta lo marcado que sigue pendiente (tras responder, la lista se recarga).
  const sel = marcados.filter(id => pendientes.some(c => c.id === id))
  const seleccionados = datos.asignados.filter(c => sel.includes(c.id))
  const toggle = (id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const todos = pendientes.length > 0 && pendientes.every(c => sel.includes(c.id))

  const responder = async () => {
    setError('')
    setOk('')
    try {
      const r = modal === 'aceptar'
        ? await aceptarAsignacion(ident, sel)
        : await rechazarAsignacion(ident, sel, motivo.trim())
      setOk(`${r.actualizados} curso(s) ${modal === 'aceptar' ? 'aceptado(s)' : 'rechazado(s)'}.`)
      setSel([])
      setMotivo('')
      setModal(null)
      onCambio()
    } catch (e) {
      setModal(null)
      setError(e.message)
    }
  }

  return (
    <>
      {error && <div className="public-form-error" role="alert">{error}</div>}
      {ok && <div className="asignia-ok" role="status">{ok}</div>}
      {datos.asignados.length === 0 ? (
        <p className="asignia-vacio">No tienes cursos asignados en el periodo {datos.periodo}. Revisa "Cursos disponibles" para postularte.</p>
      ) : (
        <>
          <div className="asignia-barra">
            <p className="asignia-ayuda">
              {pendientes.length > 0
                ? `Tienes ${pendientes.length} curso(s) pendientes de respuesta. Márcalos y acepta o rechaza la asignación.`
                : 'Ya respondiste todas tus asignaciones.'}
            </p>
            <div className="asignia-header-acciones">
              <button className="btn-secondary asignia-btn-peligro" disabled={!sel.length} onClick={() => setModal('rechazar')}><XCircle size={15} /> Rechazar ({sel.length})</button>
              <button className="btn-primary" disabled={!sel.length} onClick={() => setModal('aceptar')}><CheckCircle2 size={15} /> Aceptar asignación ({sel.length}{sel.length ? ` · ${fmtH(horasDe(seleccionados))}` : ''})</button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table asignia-tabla">
              <thead>
                <tr>
                  <th className="asignia-col-check">
                    <input type="checkbox" aria-label="Seleccionar todos los pendientes" checked={todos} disabled={!pendientes.length}
                      onChange={() => setSel(todos ? [] : pendientes.map(c => c.id))} />
                  </th>
                  <th>Curso</th><th>Grupo</th><th>Programa</th><th>Sede</th><th>Jornada</th><th>Días y horario</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.asignados.map(c => (
                  <tr key={c.id}>
                    <td data-label="Seleccionar" className="asignia-col-check">
                      <input type="checkbox" aria-label={`Seleccionar ${c.curso}`} disabled={c.verificacion !== 'asignado'}
                        checked={sel.includes(c.id)} onChange={() => toggle(c.id)} />
                    </td>
                    <CeldasCurso c={c} />
                    <td data-label="Estado">
                      <div className="asignia-celda">
                        <Badge e={ESTADOS[c.verificacion]} />
                        {c.verificacion === 'rechazado' && c.motivo_rechazo && <span className="asignia-dato">"{c.motivo_rechazo}"</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {datos.postulaciones.length > 0 && (
        <section className="asignia-seccion">
          <h3>Mis postulaciones</h3>
          <div className="table-wrapper">
            <table className="data-table asignia-tabla">
              <thead><tr><th>Curso</th><th>Grupo</th><th>Programa</th><th>Sede</th><th>Jornada</th><th>Días y horario</th><th>Postulación</th></tr></thead>
              <tbody>
                {datos.postulaciones.map(p => (
                  <tr key={p.postulacion_id}>
                    <CeldasCurso c={p} />
                    <td data-label="Postulación"><Badge e={ESTADO_POSTULACION[p.postulacion_estado]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modal === 'aceptar' && (
        <ConfirmarModal titulo="Aceptar asignación" confirmar="Sí, acepto" cursos={seleccionados}
          texto={`Vas a aceptar ${seleccionados.length} curso(s), ${fmtH(horasDe(seleccionados))} semanales. Quedarías con ${fmtH(horasDe(datos.asignados.filter(c => c.verificacion === 'aceptado')) + horasDe(seleccionados))} aceptadas. Después de aceptar no podrás cambiar la respuesta desde aquí.`}
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

function Disponibles({ ident, nombre, onCambio }) {
  const [cursos, setCursos] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [marcados, setSel] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [sede, setSede] = useState('')
  const [jornada, setJornada] = useState('')
  const [modal, setModal] = useState(false)
  const [nombreEscrito, setNombreEscrito] = useState('')

  const cargar = useCallback(() => listarDisponibles(ident)
    .then(r => setCursos(r.cursos))
    .catch(e => { setCursos([]); setError(e.message) }), [ident])

  // Carga al montar la pestaña.
  useEffect(() => { cargar() }, [cargar])

  const lista = useMemo(() => cursos || [], [cursos])
  const sedes = useMemo(() => [...new Set(lista.map(c => c.sede).filter(Boolean))].sort(), [lista])
  const jornadas = useMemo(() => [...new Set(lista.map(c => c.jornada).filter(Boolean))].sort(), [lista])
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return lista.filter(c => (!sede || c.sede === sede) && (!jornada || c.jornada === jornada) &&
      (!q || [c.codigo, c.curso, c.programa].some(v => (v || '').toLowerCase().includes(q))))
  }, [lista, busqueda, sede, jornada])
  const sel = marcados.filter(id => lista.some(c => c.id === id && !c.ya_postulado))
  const seleccionados = lista.filter(c => sel.includes(c.id))
  const toggle = (id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  const postular = async () => {
    setError('')
    setOk('')
    try {
      const r = await postularse(ident, sel, nombre || nombreEscrito.trim())
      setOk(`Te postulaste a ${r.postulados} curso(s). El líder revisará tu postulación.`)
      setSel([])
      setModal(false)
      cargar()
      onCambio()
    } catch (e) {
      setModal(false)
      setError(e.message)
    }
  }

  if (cursos === null) return <div className="loading-box"><span className="loader"></span>Cargando cursos disponibles...</div>

  return (
    <>
      {error && <div className="public-form-error" role="alert">{error}</div>}
      {ok && <div className="asignia-ok" role="status">{ok}</div>}
      <div className="asignia-barra">
        <p className="asignia-ayuda">Cursos sin profesor. Marca los que te interesan y envía tu postulación; el líder del programa decide la asignación.</p>
        <button className="btn-primary" disabled={!sel.length} onClick={() => setModal(true)}><Send size={15} /> Postularme ({sel.length}{sel.length ? ` · ${fmtH(horasDe(seleccionados))}` : ''})</button>
      </div>
      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" placeholder="Buscar curso, código o programa..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar" />
        </div>
        <select className="filter-select" value={sede} onChange={(e) => setSede(e.target.value)} aria-label="Sede">
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={jornada} onChange={(e) => setJornada(e.target.value)} aria-label="Jornada">
          <option value="">Todas las jornadas</option>
          {jornadas.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <span className="results-count">{filtrados.length} curso{filtrados.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="table-wrapper">
        <table className="data-table asignia-tabla">
          <thead>
            <tr><th className="asignia-col-check"><span className="sr-only">Seleccionar</span></th><th>Curso</th><th>Grupo</th><th>Programa</th><th>Sede</th><th>Jornada</th><th>Días y horario</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={8} className="asignia-sin-filas">No hay cursos disponibles con estos filtros.</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id}>
                <td data-label="Seleccionar" className="asignia-col-check">
                  <input type="checkbox" aria-label={`Seleccionar ${c.curso}`} disabled={c.ya_postulado}
                    checked={sel.includes(c.id)} onChange={() => toggle(c.id)} />
                </td>
                <CeldasCurso c={c} />
                <td data-label="Estado">
                  {c.ya_postulado ? <Badge e={{ label: 'Ya te postulaste', clase: 'badge-novedad' }} /> : <Badge e={{ label: 'Disponible', clase: 'badge-pending' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default function AsigniaProfesor() {
  const [ident, setIdent] = useState(null)
  const [datos, setDatos] = useState(null)
  const [tab, setTab] = useState('mis')

  const recargar = useCallback(() => consultarProfesor(ident).then(setDatos).catch(() => {}), [ident])

  if (!ident || !datos) {
    return (
      <div className="asignia-publica estilo-hub">
        <Ingreso onIngresar={(i, d) => { setIdent(i); setDatos(d) }} />
      </div>
    )
  }

  return (
    <div className="asignia-publica estilo-hub">
      <div className="asignia-publica-contenido">
        <div className="sync-page-header">
          <div>
            <h2>{datos.nombre ? `Hola, ${datos.nombre}` : 'Asignia'}</h2>
            <p className="asignia-sub">{datos.periodo ? `Programación académica ${datos.periodo}` : 'Aún no hay programación publicada.'} · {ident.correo.toLowerCase()}</p>
          </div>
          <button className="btn-secondary" onClick={() => { setIdent(null); setDatos(null); setTab('mis') }}><LogOut size={15} /> Salir</button>
        </div>

        {datos.periodo && (
          <>
            <ResumenHoras datos={datos} />
            <nav className="section-nav" aria-label="Secciones">
              <button type="button" className={`section-nav-tab${tab === 'mis' ? ' active' : ''}`} aria-current={tab === 'mis' ? 'page' : undefined} onClick={() => setTab('mis')}>
                <BookOpen size={16} /> Mis cursos
              </button>
              <button type="button" className={`section-nav-tab${tab === 'disponibles' ? ' active' : ''}`} aria-current={tab === 'disponibles' ? 'page' : undefined} onClick={() => setTab('disponibles')}>
                <Search size={16} /> Cursos disponibles
              </button>
            </nav>
            {tab === 'mis'
              ? <MisCursos ident={ident} datos={datos} onCambio={recargar} />
              : <Disponibles ident={ident} nombre={datos.nombre} onCambio={recargar} />}
          </>
        )}
      </div>
    </div>
  )
}
