import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UserRound, FileText, X, Plus, Search, Copy, CircleHelp, Save, CheckCircle2 } from 'lucide-react'
import { guardarHabilidades } from '../../../services/asignia/guardarHabilidades'
import { descargarSolicitudHoras } from '../../../services/asignia/solicitudHorasPdf'
import { registrarSolicitudHoras } from '../../../services/asignia/registrarSolicitudHoras'
import { marcarSolicitudHoras } from '../../../services/asignia/marcarSolicitudHoras'
import { alertError, toastExito } from '../../../services/alerts'

// Piezas de Mi cátedra compartidas entre la vista del líder y la del profesor:
// indicador de coincidencias, avatar, requerimientos y alerta de horas por nivel.

// Color por número de coincidencias (siempre con el número: el color no es la única señal).
const MATCH = [
  { clase: 'asignia-match-0', texto: 'Rojo' },
  { clase: 'asignia-match-1', texto: 'Naranja' },
  { clase: 'asignia-match-2', texto: 'Amarillo' },
  { clase: 'asignia-match-3', texto: 'Verde' },
]

// m = { coincidencias, nivel, total?, anios_ok?, anios?, req_anios? } o null (curso sin requerimientos).
export function Coincidencia({ m, compacto }) {
  if (!m) return compacto ? null : <span className="asignia-dato" title="El curso no tiene requerimientos configurados">Sin perfil</span>
  const c = MATCH[m.nivel] || MATCH[0]
  const detalle = [
    `${m.coincidencias}${m.total ? ` de ${m.total}` : ''} requerimiento(s) en común`,
    m.anios_ok === false ? `años de experiencia insuficientes (${m.anios} de ${m.req_anios})` : null,
  ].filter(Boolean).join(' · ')
  return (
    <span className={`badge asignia-badge asignia-match ${c.clase}`} title={detalle} aria-label={`Coincidencias: ${detalle}`}>
      {m.coincidencias} {m.coincidencias === 1 ? 'coincidencia' : 'coincidencias'}
      {m.anios_ok === false && ' · años'}
    </span>
  )
}

// Ícono de ayuda con explicación al pasar el mouse o al enfocarlo con teclado/toque.
export function Ayuda({ texto }) {
  return (
    <span className="asignia-ayuda-icono asignia-tip asignia-tip-abajo" tabIndex={0} role="img" aria-label={texto} data-tip={texto}>
      <CircleHelp size={14} aria-hidden="true" />
    </span>
  )
}

// Pantalla pública: el curso aplica a su perfil, con las habilidades del profesor que cumplen
// los requerimientos del curso y las que pide el curso y aún no tiene, a la vista.
// m = { comunes: [nombres], faltantes: [nombres], nivel }.
export function PerfilAplica({ m }) {
  if (!m) return null
  return (
    <div className="asignia-aplica">
      <span className="asignia-aplica-titulo">Su perfil aplica para el curso</span>
      <ul className="asignia-chips" aria-label="Habilidades del curso">
        {(m.comunes || []).map(n => <li key={n} className="asignia-chip asignia-chip-ok"><CheckCircle2 size={13} aria-hidden="true" /> {n}</li>)}
        {(m.faltantes || []).map(n => <li key={n} className="asignia-chip asignia-chip-falta">Falta: {n}</li>)}
      </ul>
    </div>
  )
}

// Pantalla pública: el profesor marca sus habilidades del catálogo y su nivel de dominio (1 a 10).
// perfil = { en_base, habilidades: [{ id, nombre, nivel }], catalogo: [{ id, nombre }] }.
export function MisHabilidades({ ident, perfil, onGuardado }) {
  const [lista, setLista] = useState(() => (perfil?.habilidades || []).map(h => ({ ...h, nivel: h.nivel || '' })))
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const catalogo = perfil?.catalogo || []
  // en_base lo manda el API desde esta versión: si no viene, el API aún no está actualizado (no es que falte el profesor).
  if (perfil?.en_base === undefined) {
    return <p className="asignia-aviso">Esta sección se está actualizando. Intenta de nuevo en unos minutos.</p>
  }
  if (!perfil.en_base) {
    return <p className="asignia-aviso">Aún no estás en la base de profesores de Mi cátedra. Pide al líder del programa que te registre para marcar tus habilidades.</p>
  }
  if (!catalogo.length) return <p className="asignia-ayuda">La institución aún no ha definido el catálogo de habilidades.</p>
  const busca = sinTildes(q.trim())
  const opciones = catalogo.filter(r => !lista.some(h => h.id === r.id) && (!busca || sinTildes(r.nombre).includes(busca)))
  const agregar = (r) => { setLista(l => [...l, { id: r.id, nombre: r.nombre, nivel: '' }]); setQ('') }
  const faltaNivel = lista.some(h => !h.nivel)

  const guardar = async () => {
    setGuardando(true)
    try {
      const r = await guardarHabilidades(ident, lista.map(h => ({ id: h.id, nivel: Number(h.nivel) })))
      setLista(r.habilidades.map(h => ({ ...h, nivel: h.nivel || '' })))
      toastExito('Habilidades guardadas')
      onGuardado()
    } catch (e) { alertError(e.message) }
    setGuardando(false)
  }

  return (
    <section className="asignia-habilidades-editor" aria-labelledby="asignia-hab-titulo">
      <h3 id="asignia-hab-titulo" className="asignia-mi-nota-titulo">
        Mis habilidades <Ayuda texto="Marca las habilidades que dominas y califica tu nivel de 1 (básico) a 10 (experto). Con ellas se calculan los cursos que aplican a tu perfil." />
      </h3>
      <p className="asignia-ayuda">Elige del catálogo de la institución las habilidades que tienes y tu nivel de dominio. Al guardar se actualizan los cursos disponibles para ti.</p>
      {lista.length === 0 ? <p className="asignia-dato">Aún no has marcado habilidades.</p> : (
        <ul className="asignia-hab-lista">
          {lista.map(h => (
            <li key={h.id}>
              <span>{h.nombre}</span>
              <label className="asignia-dato" htmlFor={`hab-nivel-${h.id}`}>Nivel</label>
              <select id={`hab-nivel-${h.id}`} className="filter-select" value={h.nivel} aria-invalid={!h.nivel}
                onChange={(e) => setLista(l => l.map(x => (x.id === h.id ? { ...x, nivel: e.target.value } : x)))}>
                <option value="">Elige…</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" className="btn-icon" onClick={() => setLista(l => l.filter(x => x.id !== h.id))} aria-label={`Quitar ${h.nombre}`}><X size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="asignia-reqsel">
        <div className="filter-input-wrapper asignia-reqsel-buscar">
          <Search size={15} className="filter-icon" />
          <input className="filter-input" type="search" aria-label="Buscar habilidad para agregar" placeholder={`Buscar y agregar habilidad (${opciones.length} disponibles)...`}
            value={q} onChange={(e) => { setQ(e.target.value); setAbierto(true) }} onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (opciones[0]) agregar(opciones[0]) } if (e.key === 'Escape') setAbierto(false) }} />
        </div>
        {abierto && (
          <ul className="asignia-reqsel-lista" role="listbox" aria-label="Habilidades para agregar">
            {opciones.length === 0
              ? <li className="asignia-dato">{busca ? 'Ninguna habilidad coincide.' : 'Ya agregaste todas.'}</li>
              : opciones.slice(0, MAX_SUGERENCIAS).map(r => (
                <li key={r.id} role="option" aria-selected="false">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => agregar(r)}><Plus size={13} /> {r.nombre}</button>
                </li>
              ))}
            {opciones.length > MAX_SUGERENCIAS && <li className="asignia-dato">…y {opciones.length - MAX_SUGERENCIAS} más: escribe para filtrar.</li>}
          </ul>
        )}
      </div>
      <div className="asignia-barra">
        {faltaNivel && <span className="asignia-dato" role="status">Elige el nivel de cada habilidad para guardar.</span>}
        <button type="button" className="btn-primary" onClick={guardar} disabled={guardando || faltaNivel}>
          <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar habilidades'}
        </button>
      </div>
    </section>
  )
}

// Foto en grande (las fotos son verticales, la cara queda arriba). Esc o clic fuera cierra.
function FotoModal({ url, nombre, onClose }) {
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [onClose])
  return createPortal(
    <div className="modal-overlay asignia-foto-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box asignia-foto-box" role="dialog" aria-modal="true" aria-labelledby="asignia-foto-titulo">
        <div className="modal-header">
          <h3 id="asignia-foto-titulo">{nombre || 'Profesor'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar" autoFocus>✕</button>
        </div>
        <img className="asignia-foto-grande" src={url} alt={`Foto de ${nombre || 'el profesor'}`} referrerPolicy="no-referrer" />
      </div>
    </div>,
    document.body,
  )
}

// Las fotos llegan del repositorio en tamaño original (≈3300×6000). Reducirlas de un salto a 40 px
// las deja borrosas: se dibujan en un canvas reduciendo a la mitad por pasos con suavizado alto,
// recortadas como "cover" con la cara arriba (12 %). Dibujar una imagen de otro dominio en un canvas
// que solo se muestra está permitido (no se lee el canvas), así que no depende de CORS.
function dibujarNitida(canvas, img, lado) {
  const escala = Math.max(lado / img.naturalWidth, lado / img.naturalHeight)
  const sw = lado / escala
  const sh = lado / escala
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) * 0.12
  let fuente = img
  let [x, y, w, h] = [sx, sy, sw, sh]
  while (w / 2 > lado) {
    const paso = document.createElement('canvas')
    paso.width = Math.round(w / 2)
    paso.height = Math.round(h / 2)
    const c = paso.getContext('2d')
    c.imageSmoothingQuality = 'high'
    c.drawImage(fuente, x, y, w, h, 0, 0, paso.width, paso.height)
    fuente = paso;[x, y, w, h] = [0, 0, paso.width, paso.height]
  }
  canvas.width = lado
  canvas.height = lado
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(fuente, x, y, w, h, 0, 0, lado, lado)
}

function FotoNitida({ url, alt, tamano, onError }) {
  const ref = useRef(null)
  useEffect(() => {
    let vivo = true
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    // Tamaño real en pantalla (el borde del avatar le quita unos px) por la densidad de la pantalla:
    // si el canvas se reescala aunque sea un poco, vuelve a verse borroso.
    img.onload = () => {
      if (!vivo || !ref.current) return
      const lado = Math.round((ref.current.getBoundingClientRect().width || tamano) * Math.min(window.devicePixelRatio || 1, 3))
      dibujarNitida(ref.current, img, lado)
    }
    img.onerror = () => { if (vivo) onError() }
    img.src = url
    return () => { vivo = false }
  }, [url, tamano]) // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} role="img" aria-label={alt} className="asignia-avatar-foto" />
}

// Imagen de perfil; sin enlace o si no carga, avatar genérico. Con `ampliable`, clic abre la foto en grande.
export function AvatarProfesor({ url, nombre, tamano = 40, ampliable }) {
  const [fallo, setFallo] = useState(null)
  const [abierta, setAbierta] = useState(false)
  const sirve = url && fallo !== url
  const contenido = sirve
    ? <FotoNitida url={url} alt={`Foto de ${nombre || 'el profesor'}`} tamano={tamano} onError={() => setFallo(url)} />
    : <UserRound size={Math.round(tamano * 0.55)} aria-label="Sin foto" />
  if (!ampliable || !sirve) return <span className="asignia-avatar" style={{ width: tamano, height: tamano }}>{contenido}</span>
  return (
    <>
      <button type="button" className="asignia-avatar asignia-avatar-btn" style={{ width: tamano, height: tamano }}
        onClick={() => setAbierta(true)} aria-label={`Ver foto de ${nombre || 'el profesor'}`} title="Ver foto">
        {contenido}
      </button>
      {abierta && <FotoModal url={url} nombre={nombre} onClose={() => setAbierta(false)} />}
    </>
  )
}

const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MAX_SUGERENCIAS = 8

// Requerimientos activos del catálogo: los elegidos como chips (se quitan con ✕) y un
// buscador para agregar. Así 50 requerimientos no llenan el formulario. valor = [ids].
export function RequerimientosChecks({ catalogo, valor, onChange, id }) {
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const activos = catalogo.filter(r => r.activo)
  if (!activos.length) return <p className="asignia-ayuda">Aún no hay requerimientos en el catálogo. Créalos en Configuración.</p>
  const elegidos = activos.filter(r => valor.includes(r.id))
  const busca = sinTildes(q.trim())
  const opciones = activos.filter(r => !valor.includes(r.id) && (!busca || sinTildes(r.nombre).includes(busca)))
  const agregar = (rid) => { onChange([...valor, rid]); setQ('') }
  const quitar = (rid) => onChange(valor.filter(x => x !== rid))

  return (
    <div className="asignia-reqsel">
      {elegidos.length > 0 && (
        <ul className="asignia-chips" aria-label="Requerimientos elegidos">
          {elegidos.map(r => (
            <li key={r.id} className="asignia-chip">
              {r.nombre}
              <button type="button" onClick={() => quitar(r.id)} aria-label={`Quitar ${r.nombre}`}><X size={13} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="filter-input-wrapper asignia-reqsel-buscar">
        <Search size={15} className="filter-icon" />
        <input className="filter-input" type="search" aria-labelledby={id} placeholder={`Buscar y agregar (${activos.length - elegidos.length} disponibles)...`}
          value={q} onChange={(e) => { setQ(e.target.value); setAbierto(true) }} onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (opciones[0]) agregar(opciones[0].id) } if (e.key === 'Escape') setAbierto(false) }} />
      </div>
      {abierto && (
        <ul className="asignia-reqsel-lista" role="listbox" aria-label="Requerimientos para agregar">
          {opciones.length === 0
            ? <li className="asignia-dato">{busca ? 'Ningún requerimiento coincide.' : 'Ya elegiste todos.'}</li>
            : opciones.slice(0, MAX_SUGERENCIAS).map(r => (
              <li key={r.id} role="option" aria-selected="false">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => agregar(r.id)}><Plus size={13} /> {r.nombre}</button>
              </li>
            ))}
          {opciones.length > MAX_SUGERENCIAS && <li className="asignia-dato">…y {opciones.length - MAX_SUGERENCIAS} más: escribe para filtrar.</li>}
        </ul>
      )}
    </div>
  )
}

// Texto que se copia al portapapeles con un clic (cédula, correo) en las vistas del líder.
export function CopiarDato({ texto, etiqueta, className = '' }) {
  if (!texto) return null
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      toastExito(`${etiqueta} copiado`)
    } catch {
      alertError(`No se pudo copiar. ${etiqueta}: ${texto}`)
    }
  }
  return (
    <button type="button" className={`asignia-copiar ${className}`} onClick={copiar} title={`Copiar ${etiqueta.toLowerCase()}`} aria-label={`Copiar ${etiqueta.toLowerCase()} ${texto}`}>
      <span>{texto}</span><Copy size={12} aria-hidden="true" />
    </button>
  )
}

const fmt = (n) => (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(1))

const fecha = (v) => new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

// Alerta de horas según el nivel académico. alerta = 'minimo' | 'maximo' | null.
// Bajo el mínimo, con `solicitud` ({ periodo, redacto, carta, onCarta }), se habilita "Generar solicitud":
// la carta de autorización de carga mínima (la firma el líder, por eso solo en la vista del líder).
// Al descargarla queda registrada y el líder la marca como gestionada cuando ya la envió.
// Barra de carga del periodo: horas frente al rango del nivel académico; el color y el texto dicen la alerta.
export function BarraCarga({ horas, cursos, nivel, alerta }) {
  const max = Number(nivel?.max_horas) || 0
  const pct = max ? Math.min(100, Math.round((horas / max) * 100)) : 0
  const estado = alerta === 'minimo' ? 'Bajo el mínimo' : alerta === 'maximo' ? 'Cupo alcanzado' : null
  return (
    <div className="asignia-carga">
      <span>
        <strong>{fmt(horas)} h</strong>
        <span className="asignia-dato"> · {cursos} curso{cursos !== 1 ? 's' : ''}{nivel ? ` · ${nivel.nombre} ${fmt(nivel.min_horas)}–${fmt(nivel.max_horas)} h` : ' · sin nivel académico'}</span>
      </span>
      {nivel && (
        <span className={`asignia-carga-barra${alerta ? ` asignia-carga-${alerta}` : ''}`} role="img"
          aria-label={`${fmt(horas)} de ${fmt(max)} horas${estado ? `, ${estado.toLowerCase()}` : ''}`}>
          <span style={{ width: `${pct}%` }} />
        </span>
      )}
      {estado && <span className={`asignia-carga-texto asignia-carga-${alerta}`}>{estado}</span>}
    </div>
  )
}

// Con `soloCarta`, solo la solicitud de carga mínima (la barra la pinta BarraCarga).
export function AlertaHoras({ nivel, horas, alerta, profesor, solicitud, soloCarta }) {
  const [generando, setGenerando] = useState(false)
  const carta = solicitud?.carta
  const generar = async () => {
    setGenerando(true)
    try {
      await descargarSolicitudHoras({ ...profesor, nivel, horas }, solicitud.periodo, solicitud.redacto)
      solicitud.onCarta(await registrarSolicitudHoras({
        periodo: solicitud.periodo, documento: profesor.documento, nombre: profesor.nombre, horas, min_horas: nivel.min_horas,
      }))
    } catch (e) { alertError(e.message) }
    setGenerando(false)
  }
  const marcar = async (gestionada) => {
    try {
      solicitud.onCarta(await marcarSolicitudHoras(carta.id, gestionada))
      toastExito(gestionada ? 'Carta marcada como gestionada' : 'Marca quitada')
    } catch (e) { alertError(e.message) }
  }
  if (!nivel) return soloCarta ? null : <span className="asignia-dato">Sin nivel académico</span>
  if (soloCarta && !(alerta === 'minimo' && solicitud)) return null
  if (soloCarta) {
    return (
      <div className="asignia-nivel-carta">
        <button type="button" className="btn-secondary asignia-btn-fila" onClick={generar} disabled={generando}>
          <FileText size={15} /> {generando ? 'Generando...' : carta ? 'Volver a generar carta' : 'Generar carta de carga mínima'}
        </button>
        {carta && (
          <label className={`asignia-carta${carta.gestionada ? ' lista' : ''}`}
            title={carta.gestionada
              ? `Gestionada el ${fecha(carta.gestionada_at)}${carta.gestionada_por ? ` por ${carta.gestionada_por}` : ''}`
              : `Carta generada el ${fecha(carta.generada_at)}. Márcala cuando la envíes.`}>
            <input type="checkbox" checked={carta.gestionada} onChange={(e) => marcar(e.target.checked)} />
            {carta.gestionada ? `Gestionada ${fecha(carta.gestionada_at)}` : 'Pendiente de enviar'}
          </label>
        )}
      </div>
    )
  }
  // Compacto: nombre (máx. 2 líneas, completo en el tooltip), rango, alerta corta y la carta en una fila de íconos.
  return (
    <div className="asignia-celda asignia-nivel">
      <span className="asignia-nivel-nombre" title={nivel.nombre}>{nivel.nombre}</span>
      <span className="asignia-dato">Rango {fmt(nivel.min_horas)}–{fmt(nivel.max_horas)} h</span>
      {alerta === 'minimo' && (
        <span className="badge asignia-badge badge-novedad" title={`Bajo el mínimo: ${fmt(horas)} de ${fmt(nivel.min_horas)} h`}>
          Bajo mínimo · {fmt(horas)}/{fmt(nivel.min_horas)} h
        </span>
      )}
      {alerta === 'maximo' && (
        <span className="badge asignia-badge badge-error" title={`Cupo alcanzado: ${fmt(horas)} de ${fmt(nivel.max_horas)} h`}>
          Cupo lleno · {fmt(horas)}/{fmt(nivel.max_horas)} h
        </span>
      )}
      {alerta === 'minimo' && solicitud && (
        <div className="asignia-nivel-carta">
          <button type="button" className="btn-icon asignia-accion asignia-tip" onClick={generar} disabled={generando}
            data-tip={generando ? 'Generando...' : carta ? 'Volver a generar la solicitud' : 'Generar solicitud de carga mínima'}
            aria-label={carta ? 'Volver a generar la solicitud' : 'Generar solicitud de carga mínima'}>
            <FileText size={15} />
          </button>
          {carta && (
            <label className={`asignia-carta${carta.gestionada ? ' lista' : ''}`}
              title={carta.gestionada
                ? `Gestionada el ${fecha(carta.gestionada_at)}${carta.gestionada_por ? ` por ${carta.gestionada_por}` : ''}`
                : `Carta generada el ${fecha(carta.generada_at)}. Márcala cuando la envíes.`}>
              <input type="checkbox" checked={carta.gestionada} onChange={(e) => marcar(e.target.checked)} />
              {carta.gestionada ? `Gestionada ${fecha(carta.gestionada_at)}` : 'Pendiente'}
            </label>
          )}
        </div>
      )}
    </div>
  )
}
