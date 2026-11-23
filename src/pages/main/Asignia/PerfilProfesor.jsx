import { useState } from 'react'
import { UserRound, FileText } from 'lucide-react'
import { descargarSolicitudHoras } from '../../../services/asignia/solicitudHorasPdf'

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

// Imagen de perfil; sin enlace o si no carga, avatar genérico.
export function AvatarProfesor({ url, nombre, tamano = 40 }) {
  const [fallo, setFallo] = useState(null)
  const sirve = url && fallo !== url
  return (
    <span className="asignia-avatar" style={{ width: tamano, height: tamano }}>
      {sirve
        ? <img src={url} alt={`Foto de ${nombre || 'el profesor'}`} onError={() => setFallo(url)} referrerPolicy="no-referrer" />
        : <UserRound size={Math.round(tamano * 0.55)} aria-label="Sin foto" />}
    </span>
  )
}

// Casillas de requerimientos activos del catálogo. valor = [ids].
export function RequerimientosChecks({ catalogo, valor, onChange, id }) {
  const activos = catalogo.filter(r => r.activo)
  if (!activos.length) return <p className="asignia-ayuda">Aún no hay requerimientos en el catálogo. Créalos en Configuración.</p>
  const toggle = (rid) => onChange(valor.includes(rid) ? valor.filter(x => x !== rid) : [...valor, rid])
  return (
    <div className="asignia-reqs" role="group" aria-labelledby={id}>
      {activos.map(r => (
        <label key={r.id} className={`asignia-req${valor.includes(r.id) ? ' activo' : ''}`}>
          <input type="checkbox" checked={valor.includes(r.id)} onChange={() => toggle(r.id)} /> {r.nombre}
        </label>
      ))}
    </div>
  )
}

const fmt = (n) => (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(1))

// Alerta de horas según el nivel académico. alerta = 'minimo' | 'maximo' | null.
// Bajo el mínimo, con `solicitud` ({ periodo, redacto }), se habilita "Generar solicitud":
// la carta de autorización de carga mínima (la firma el líder, por eso solo en la vista del líder).
export function AlertaHoras({ nivel, horas, alerta, profesor, solicitud }) {
  const [generando, setGenerando] = useState(false)
  const generar = async () => {
    setGenerando(true)
    try { await descargarSolicitudHoras({ ...profesor, nivel, horas }, solicitud.periodo, solicitud.redacto) } finally { setGenerando(false) }
  }
  if (!nivel) return <span className="asignia-dato">Sin nivel académico</span>
  return (
    <div className="asignia-celda">
      <span>{nivel.nombre} <span className="asignia-dato">({fmt(nivel.min_horas)}–{fmt(nivel.max_horas)} h)</span></span>
      {alerta === 'minimo' && (
        <>
          <span className="badge asignia-badge badge-novedad">Bajo el mínimo: {fmt(horas)} de {fmt(nivel.min_horas)} h</span>
          {solicitud && (
            <button type="button" className="btn-secondary asignia-btn-fila" onClick={generar} disabled={generando}>
              <FileText size={15} /> {generando ? 'Generando...' : 'Generar solicitud'}
            </button>
          )}
        </>
      )}
      {alerta === 'maximo' && <span className="badge asignia-badge badge-error">Cupo alcanzado: {fmt(horas)} de {fmt(nivel.max_horas)} h</span>}
    </div>
  )
}
