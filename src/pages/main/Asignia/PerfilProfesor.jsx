import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UserRound, FileText, X, Plus, Search, Copy } from 'lucide-react'
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

// Imagen de perfil; sin enlace o si no carga, avatar genérico. Con `ampliable`, clic abre la foto en grande.
export function AvatarProfesor({ url, nombre, tamano = 40, ampliable }) {
  const [fallo, setFallo] = useState(null)
  const [abierta, setAbierta] = useState(false)
  const sirve = url && fallo !== url
  const contenido = sirve
    ? <img src={url} alt={`Foto de ${nombre || 'el profesor'}`} onError={() => setFallo(url)} referrerPolicy="no-referrer" />
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
export function AlertaHoras({ nivel, horas, alerta, profesor, solicitud }) {
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
  if (!nivel) return <span className="asignia-dato">Sin nivel académico</span>
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
