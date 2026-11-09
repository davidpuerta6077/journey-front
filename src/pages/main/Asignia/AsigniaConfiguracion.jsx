import { useState, useEffect } from 'react'
import { Save, Plus, Pencil, Trash2, X, Wand2 } from 'lucide-react'
import { obtenerSemestre } from '../../../services/asignia/obtenerSemestre'
import { obtenerPeriodos } from '../../../services/asignia/obtenerPeriodos'
import { guardarPeriodoActivo } from '../../../services/asignia/guardarPeriodoActivo'
import { guardarSemestre } from '../../../services/asignia/guardarSemestre'
import { crearSemanaEspecial } from '../../../services/asignia/crearSemanaEspecial'
import { actualizarSemanaEspecial } from '../../../services/asignia/actualizarSemanaEspecial'
import { borrarSemanaEspecial } from '../../../services/asignia/borrarSemanaEspecial'
import { listarNoLaborables } from '../../../services/asignia/listarNoLaborables'
import { crearNoLaborable } from '../../../services/asignia/crearNoLaborable'
import { actualizarNoLaborable } from '../../../services/asignia/actualizarNoLaborable'
import { borrarNoLaborable } from '../../../services/asignia/borrarNoLaborable'
import { generarFestivos } from '../../../services/asignia/generarFestivos'
import { alertError, confirmAccion, toastExito } from '../../../services/alerts'
import { fechaLarga, fechaCorta, hoyBogota } from './calendario/calendarioUtil'
import '../../../styles/main/Asignia/AsigniaCalendario.css'

const SEMANA_VACIA = { id: null, nombre: '', fecha_inicio: '', fecha_fin: '', sin_clase: true }
const DIA_VACIO = { fecha: '', nombre: '', tipo: 'institucional', editando: false }

// Respuesta guardada con la clave de la consulta: si no coincide, está cargando.
function useConsulta(clave, fn) {
  const [resp, setResp] = useState({ clave: null, data: null })
  useEffect(() => {
    if (!clave) return
    fn().then(data => setResp({ clave, data })).catch(e => { alertError(e.message); setResp({ clave, data: false }) })
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps
  return resp.clave === clave ? resp.data : null
}

// Periodo activo: el que ve el profesor en su enlace y con el que abren las vistas del líder.
function PeriodoActivo({ info, puedeEditar, onGuardado }) {
  const [valor, setValor] = useState(info.configurado || '')
  const [guardando, setGuardando] = useState(false)
  const elegido = info.periodos.find(p => p.periodo === valor)

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await guardarPeriodoActivo(valor)
      toastExito(valor ? `Periodo activo: ${valor}` : 'Periodo activo automático')
      onGuardado()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  return (
    <form className="cal-config-bloque" onSubmit={guardar}>
      <h3>Periodo activo</h3>
      <p className="asignia-ayuda">Es el periodo que ven los profesores en su enlace y con el que abren Programación, Calendario y Postulaciones. Hoy: <strong>{info.activo || '—'}</strong>{info.configurado ? ' (elegido)' : ' (automático)'}.</p>
      <div className="cal-config-fila">
        <div className="modal-field cal-config-ancho">
          <label htmlFor="per-activo">Periodo</label>
          <select id="per-activo" value={valor} onChange={(e) => setValor(e.target.value)} disabled={!puedeEditar}>
            <option value="">Automático: el más reciente con cursos ({info.masReciente || 'ninguno'})</option>
            {info.periodos.map(p => <option key={p.periodo} value={p.periodo}>{p.periodo}{p.cursos ? ` · ${p.cursos} cursos` : ' · sin cursos'}</option>)}
          </select>
        </div>
        {puedeEditar && (
          <div className="cal-config-acciones">
            <button className="btn-primary" type="submit" disabled={guardando || valor === (info.configurado || '')}><Save size={15} /> {guardando ? 'Guardando...' : 'Guardar periodo activo'}</button>
          </div>
        )}
      </div>
      {elegido && !elegido.cursos && <p className="asignia-aviso">{elegido.periodo} todavía no tiene cursos: mientras tanto los profesores no verán programación en su enlace.</p>}
    </form>
  )
}

function Semestre({ periodo, periodos, onPeriodo, semestre, puedeEditar, onGuardado }) {
  const [form, setForm] = useState(() => ({
    fecha_inicio: semestre?.fecha_inicio || '', fecha_fin: semestre?.fecha_fin || '',
    hora_inicio: semestre?.hora_inicio || '06:00', hora_fin: semestre?.hora_fin || '22:00',
  }))
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await guardarSemestre(periodo, form)
      toastExito('Semestre guardado')
      onGuardado()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  return (
    <form className="cal-config-bloque" onSubmit={guardar}>
      <div className="cal-config-titulo">
        <h3>Fechas del semestre</h3>
        <label className="cal-color-por">
          Periodo
          <select className="filter-select" value={periodo} onChange={(e) => onPeriodo(e.target.value)}>
            {periodos.map(p => <option key={p.periodo} value={p.periodo}>{p.periodo}{p.cursos ? ` · ${p.cursos} cursos` : ''}</option>)}
          </select>
        </label>
      </div>
      <p className="asignia-ayuda">El calendario solo navega entre estas fechas. La jornada define las horas que se ven en la cuadrícula.</p>
      <div className="cal-config-grid">
        <div className="modal-field"><label htmlFor="sem-ini">Fecha de inicio</label><input id="sem-ini" type="date" required value={form.fecha_inicio} onChange={set('fecha_inicio')} disabled={!puedeEditar} /></div>
        <div className="modal-field"><label htmlFor="sem-fin">Fecha de fin</label><input id="sem-fin" type="date" required min={form.fecha_inicio || undefined} value={form.fecha_fin} onChange={set('fecha_fin')} disabled={!puedeEditar} /></div>
        <div className="modal-field"><label htmlFor="sem-hini">Inicio de la jornada</label><input id="sem-hini" type="time" step={1800} required value={form.hora_inicio} onChange={set('hora_inicio')} disabled={!puedeEditar} /></div>
        <div className="modal-field"><label htmlFor="sem-hfin">Fin de la jornada</label><input id="sem-hfin" type="time" step={1800} required value={form.hora_fin} onChange={set('hora_fin')} disabled={!puedeEditar} /></div>
      </div>
      {puedeEditar && (
        <div className="cal-config-acciones">
          <button className="btn-primary" type="submit" disabled={guardando}><Save size={15} /> {guardando ? 'Guardando...' : 'Guardar semestre'}</button>
        </div>
      )}
    </form>
  )
}

function Semanas({ periodo, semestre, semanas, puedeEditar, onCambio }) {
  const [form, setForm] = useState(SEMANA_VACIA)
  const [guardando, setGuardando] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: k === 'sin_clase' ? e.target.checked : e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const datos = { nombre: form.nombre, fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin, sin_clase: form.sin_clase }
      if (form.id) await actualizarSemanaEspecial(form.id, datos)
      else await crearSemanaEspecial(periodo, datos)
      toastExito(form.id ? 'Semana actualizada' : 'Semana agregada')
      setForm(SEMANA_VACIA)
      onCambio()
    } catch (err) { alertError(err.message) }
    setGuardando(false)
  }

  const borrar = async (s) => {
    if (!(await confirmAccion({ title: '¿Borrar la semana?', text: `${s.nombre} (${fechaCorta(s.fecha_inicio)} – ${fechaCorta(s.fecha_fin)})`, confirmButtonText: 'Sí, borrar' }))) return
    try {
      await borrarSemanaEspecial(s.id)
      toastExito('Semana borrada')
      if (form.id === s.id) setForm(SEMANA_VACIA)
      onCambio()
    } catch (err) { alertError(err.message) }
  }

  return (
    <section className="cal-config-bloque">
      <h3>Semanas especiales · {periodo}</h3>
      <p className="asignia-ayuda">Receso, semana de parciales, etc. "Sin clase" descuenta esas sesiones de la carga; si no, la semana solo queda marcada en el calendario.</p>
      {!semestre ? <p className="asignia-aviso">Guarda primero las fechas del semestre.</p> : (
        <>
          {puedeEditar && (
            <form className="cal-config-fila" onSubmit={guardar}>
              <div className="modal-field cal-config-ancho"><label htmlFor="sem-nombre">Nombre</label><input id="sem-nombre" required maxLength={100} value={form.nombre} onChange={set('nombre')} placeholder="Ej. Receso de Semana Santa" /></div>
              <div className="modal-field"><label htmlFor="sem-desde">Desde</label><input id="sem-desde" type="date" required min={semestre.fecha_inicio} max={semestre.fecha_fin} value={form.fecha_inicio} onChange={set('fecha_inicio')} /></div>
              <div className="modal-field"><label htmlFor="sem-hasta">Hasta</label><input id="sem-hasta" type="date" required min={form.fecha_inicio || semestre.fecha_inicio} max={semestre.fecha_fin} value={form.fecha_fin} onChange={set('fecha_fin')} /></div>
              <label className="cal-config-check"><input type="checkbox" checked={form.sin_clase} onChange={set('sin_clase')} /> Sin clase</label>
              <div className="cal-config-acciones">
                {form.id && <button type="button" className="btn-secondary" onClick={() => setForm(SEMANA_VACIA)}><X size={15} /> Cancelar</button>}
                <button className="btn-primary" type="submit" disabled={guardando}>{form.id ? <><Save size={15} /> Guardar cambios</> : <><Plus size={15} /> Agregar</>}</button>
              </div>
            </form>
          )}
          {semanas.length === 0 ? <p className="asignia-ayuda">No hay semanas especiales.</p> : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Nombre</th><th>Desde</th><th>Hasta</th><th>Clases</th>{puedeEditar && <th>Acciones</th>}</tr></thead>
                <tbody>
                  {semanas.map(s => (
                    <tr key={s.id}>
                      <td data-label="Nombre">{s.nombre}</td>
                      <td data-label="Desde">{fechaLarga(s.fecha_inicio)}</td>
                      <td data-label="Hasta">{fechaLarga(s.fecha_fin)}</td>
                      <td data-label="Clases"><span className={`badge ${s.sin_clase ? 'badge-error' : 'badge-novedad'}`}>{s.sin_clase ? 'Sin clase' : 'Con clase (marcada)'}</span></td>
                      {puedeEditar && (
                        <td data-label="Acciones">
                          <div className="cal-config-acciones-fila">
                            <button type="button" className="btn-icon" onClick={() => setForm(s)} aria-label={`Editar ${s.nombre}`}><Pencil size={15} /></button>
                            <button type="button" className="btn-icon" onClick={() => borrar(s)} aria-label={`Borrar ${s.nombre}`}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function NoLaborables({ anioInicial, anios: aniosDisponibles, puedeEditar }) {
  const [anio, setAnio] = useState(anioInicial)
  const [ver, setVer] = useState(0)
  const dias = useConsulta(`${anio}#${ver}`, () => listarNoLaborables({ desde: `${anio}-01-01`, hasta: `${anio}-12-31` }))
  const [form, setForm] = useState(DIA_VACIO)
  const [ocupado, setOcupado] = useState(false)
  const recargar = () => setVer(v => v + 1)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const ejecutar = async (fn, ok) => {
    setOcupado(true)
    let exito = false
    try { const r = await fn(); toastExito(typeof ok === 'function' ? ok(r) : ok); recargar(); exito = true } catch (err) { alertError(err.message) }
    setOcupado(false)
    return exito
  }

  const guardar = (e) => {
    e.preventDefault()
    const datos = { fecha: form.fecha, nombre: form.nombre, tipo: form.tipo, activo: true }
    ejecutar(() => (form.editando ? actualizarNoLaborable(form.fecha, datos) : crearNoLaborable(datos)), form.editando ? 'Día actualizado' : 'Día agregado')
      .then(exito => { if (exito) setForm(DIA_VACIO) })
  }

  const generar = async () => {
    if (!(await confirmAccion({
      title: `¿Generar los festivos de ${anio}?`,
      text: 'Se calculan los 18 festivos de Colombia (Ley Emiliani y fechas de Pascua). Los días que editaste o desactivaste a mano no se tocan.',
      icon: 'question', confirmButtonText: 'Sí, generar',
    }))) return
    ejecutar(() => generarFestivos(anio), r => `Festivos de ${anio}: ${r.nuevos} nuevos, ${r.actualizados} actualizados, ${r.conservados} conservados`)
  }

  const borrar = async (d) => {
    if (!(await confirmAccion({
      title: `¿Quitar ${d.nombre}?`,
      text: d.tipo === 'festivo' ? 'Si es un festivo oficial no se borra: queda desactivado para que no vuelva a aparecer al generar los festivos.' : fechaLarga(d.fecha),
      confirmButtonText: 'Sí, quitar',
    }))) return
    ejecutar(() => borrarNoLaborable(d.fecha), r => (r?.accion === 'desactivado' ? 'Festivo desactivado' : 'Día borrado'))
  }

  // Años calculados desde el periodo activo (−1 a +2) más los que ya tienen datos.
  const anios = [...new Set([anioInicial, ...aniosDisponibles])].sort((a, b) => a - b)

  return (
    <section className="cal-config-bloque">
      <h3>Festivos y días no laborables</h3>
      <p className="asignia-ayuda">Esos días se sombrean en el calendario, no se dibujan clases y se descuentan de las horas del semestre. Un festivo editado o desactivado a mano ya no se recalcula.</p>
      <div className="cal-config-fila">
        <div className="modal-field"><label htmlFor="nl-anio">Año</label>
          <select id="nl-anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>{anios.map(a => <option key={a} value={a}>{a}</option>)}</select>
        </div>
        {puedeEditar && <button type="button" className="btn-secondary cal-config-boton" onClick={generar} disabled={ocupado}><Wand2 size={15} /> Generar festivos de {anio}</button>}
      </div>
      {puedeEditar && (
        <form className="cal-config-fila" onSubmit={guardar}>
          <div className="modal-field"><label htmlFor="nl-fecha">Fecha</label><input id="nl-fecha" type="date" required value={form.fecha} onChange={set('fecha')} disabled={form.editando} /></div>
          <div className="modal-field cal-config-ancho"><label htmlFor="nl-nombre">Nombre</label><input id="nl-nombre" required maxLength={120} value={form.nombre} onChange={set('nombre')} placeholder="Ej. Día de la institución" /></div>
          <div className="modal-field"><label htmlFor="nl-tipo">Tipo</label>
            <select id="nl-tipo" value={form.tipo} onChange={set('tipo')}><option value="institucional">Institucional</option><option value="festivo">Festivo</option></select>
          </div>
          <div className="cal-config-acciones">
            {form.editando && <button type="button" className="btn-secondary" onClick={() => setForm(DIA_VACIO)}><X size={15} /> Cancelar</button>}
            <button className="btn-primary" type="submit" disabled={ocupado}>{form.editando ? <><Save size={15} /> Guardar cambios</> : <><Plus size={15} /> Agregar día</>}</button>
          </div>
        </form>
      )}
      {dias === null ? <div className="loading-box"><span className="loader"></span>Cargando...</div> : !dias?.length ? (
        <p className="asignia-ayuda">No hay días no laborables en {anio}.{puedeEditar ? ` Usa "Generar festivos de ${anio}".` : ''}</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th>Origen</th><th>Activo</th>{puedeEditar && <th>Acciones</th>}</tr></thead>
            <tbody>
              {dias.map(d => (
                <tr key={d.fecha} className={d.activo ? '' : 'cal-config-inactivo'}>
                  <td data-label="Fecha">{fechaLarga(d.fecha)}</td>
                  <td data-label="Nombre">{d.nombre}</td>
                  <td data-label="Tipo"><span className={`badge ${d.tipo === 'festivo' ? 'badge-syncing' : 'badge-novedad'}`}>{d.tipo === 'festivo' ? 'Festivo' : 'Institucional'}</span></td>
                  <td data-label="Origen">{d.origen === 'calculado' ? 'Calculado' : 'Manual'}</td>
                  <td data-label="Activo">
                    <input type="checkbox" checked={d.activo} disabled={!puedeEditar || ocupado} aria-label={`${d.nombre} activo`}
                      onChange={(e) => ejecutar(() => actualizarNoLaborable(d.fecha, { nombre: d.nombre, tipo: d.tipo, activo: e.target.checked }), e.target.checked ? 'Día activado' : 'Día desactivado')} />
                  </td>
                  {puedeEditar && (
                    <td data-label="Acciones">
                      <div className="cal-config-acciones-fila">
                        <button type="button" className="btn-icon" onClick={() => setForm({ fecha: d.fecha, nombre: d.nombre, tipo: d.tipo, editando: true })} aria-label={`Editar ${d.nombre}`}><Pencil size={15} /></button>
                        <button type="button" className="btn-icon" onClick={() => borrar(d)} aria-label={`Quitar ${d.nombre}`}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Pestaña "Configuración": semestre, semanas especiales y días no laborables.
export default function AsigniaConfiguracion({ periodo: periodoInicial, puedeEditar }) {
  const [ver, setVer] = useState(0)
  const info = useConsulta(`periodos#${ver}`, () => obtenerPeriodos())
  // Periodo cuyas fechas se configuran: el elegido aquí o, por defecto, el periodo activo.
  const [elegido, setElegido] = useState('')
  const periodo = elegido || info?.activo || periodoInicial
  const data = useConsulta(`${periodo}#${ver}`, () => obtenerSemestre(periodo))
  const recargar = () => setVer(v => v + 1)

  if (data === null || info === null) return <div className="loading-box"><span className="loader"></span>Cargando configuración...</div>
  if (data === false || info === false) return null

  const anio = Number((data.semestre?.fecha_inicio || hoyBogota()).slice(0, 4))
  return (
    <div className="cal-config">
      {!puedeEditar && <p className="asignia-aviso">Solo quien tiene el permiso de configuración (o gestión completa) de Asignia puede cambiar esta configuración.</p>}
      <PeriodoActivo key={`${info.configurado}${ver}`} info={info} puedeEditar={puedeEditar} onGuardado={recargar} />
      <Semestre key={`${periodo}${data.semestre?.fecha_inicio}${data.semestre?.fecha_fin}`} periodo={periodo} periodos={info.periodos} onPeriodo={setElegido} semestre={data.semestre} puedeEditar={puedeEditar} onGuardado={recargar} />
      <Semanas periodo={periodo} semestre={data.semestre} semanas={data.semanas} puedeEditar={puedeEditar} onCambio={recargar} />
      <NoLaborables key={anio} anioInicial={anio} anios={info.anios} puedeEditar={puedeEditar} />
    </div>
  )
}
