import { useEffect, useRef, useState } from 'react'
import {
  Users, Activity, LayoutGrid, UsersRound, BookOpen, GraduationCap, Bell, FileText, Paperclip, ClipboardList,
  UserCheck, ListTodo, AlertTriangle, CheckCircle2, Clock, LayoutTemplate, FilePlus, LayoutDashboard, Zap,
  Sparkles, CheckSquare, Inbox,
} from 'lucide-react'
import { fetchEstadisticas } from '../../../services/estadisticas/fetchEstadisticas'
import InformeGrafico from '../Reportes/InformeGrafico'
import GraficoLinea from './GraficoLinea'
import { Medidor, MapaCalor, Columnas, Mosaico } from './GraficosExtra'
import '../../../styles/main/NexoHome.css'
import '../../../styles/main/Reportes/Constructor.css'
import '../../../styles/main/Estadisticas/Estadisticas.css'

const APPS = [
  { key: 'general', label: 'General', icon: LayoutDashboard, desc: 'Uso de Bravo Hub en todas las aplicaciones' },
  { key: 'nexo', label: 'Nexo', icon: Zap, desc: 'Usuarios, cursos, matrículas y novedades de SICAU' },
  { key: 'onix', label: 'Onix-IA', icon: Sparkles, desc: 'Registros de actividades e informes' },
  { key: 'acudex', label: 'Acudex', icon: ClipboardList, desc: 'Formularios y asistencias' },
  { key: 'atom', label: 'Atom', icon: CheckSquare, desc: 'Tareas del equipo' },
  { key: 'codex', label: 'C0deX', icon: LayoutTemplate, desc: 'Páginas creadas y editadas' },
]
const PERIODOS = [[7, '7 días'], [30, '30 días'], [90, '3 meses'], [180, '6 meses'], [365, '1 año']]

// Ícono de cada cifra (la API manda el nombre).
const ICONOS = {
  usuarios: Users, actividad: Activity, app: LayoutGrid, equipo: UsersRound, cursos: BookOpen, matriculas: GraduationCap,
  novedades: Bell, informes: FileText, archivos: Paperclip, formularios: ClipboardList, asistencia: UserCheck,
  tareas: ListTodo, alerta: AlertTriangle, completadas: CheckCircle2, reloj: Clock, paginas: LayoutTemplate, nuevas: FilePlus,
}
const ACENTOS = ['#5b73c4', '#e0733a', '#1f9e9e', '#9b59b6']
const TONO = { alerta: '#d64545', aviso: '#d99a2b' }

const numero = (v) => (typeof v === 'number' ? v.toLocaleString('es-CO') : v ?? '—')

// "▲ 12 % vs periodo anterior", con el caso de periodo anterior en cero.
function comparacion(valor, anterior) {
  if (typeof anterior !== 'number' || typeof valor !== 'number') return null
  if (valor === anterior) return { texto: 'Igual que el periodo anterior', clase: 'is-neutral' }
  if (anterior === 0) return { texto: `▲ ${numero(valor)} más que el periodo anterior`, clase: '' }
  const pct = Math.round(((valor - anterior) / anterior) * 100)
  if (pct >= 1000) return { texto: `▲ ${numero(Math.round(valor / anterior))} veces el periodo anterior`, clase: '' }
  return pct >= 0
    ? { texto: `▲ ${pct} % vs periodo anterior`, clase: '' }
    : { texto: `▼ ${Math.abs(pct)} % vs periodo anterior`, clase: 'est-baja' }
}

function Cifra({ kpi, i }) {
  const Icono = ICONOS[kpi.icono] || Activity
  const acento = TONO[kpi.tono] || ACENTOS[i % ACENTOS.length]
  const comp = comparacion(kpi.valor, kpi.anterior)
  return (
    <div className="nexo-card nexo-kpi-card">
      <div className="nexo-kpi-icon" style={{ '--nexo-kpi-accent': acento }}>
        <Icono size={22} strokeWidth={1.75} />
      </div>
      <div className="nexo-kpi-body">
        <span className="nexo-kpi-value">{numero(kpi.valor)}</span>
        <span className="nexo-kpi-label">{kpi.label}</span>
        {comp && <span className={`nexo-kpi-delta ${comp.clase}`}>{comp.texto}</span>}
        {kpi.nota && <span className={`nexo-kpi-delta is-neutral${kpi.tono ? ' est-nota-tono' : ''}`} style={kpi.tono ? { color: acento } : undefined}>{kpi.nota}</span>}
      </div>
    </div>
  )
}

const Vacio = ({ texto = 'Sin datos en este periodo' }) => (
  <p className="est-vacio"><Inbox size={18} /> {texto}</p>
)

// Tipos que necesitan toda la fila para leerse bien.
const ANCHOS = ['linea', 'calor', 'mosaico']

// Bloques en una cuadrícula de 2 columnas: los anchos ocupan la fila; un bloque
// angosto que quedaría solo (antes de uno ancho o al final) también la ocupa.
function repartir(bloques) {
  const out = bloques.map((b) => ({ ...b, ancho: b.ancho }))
  let abierto = null
  out.forEach((b, i) => {
    if (b.ancho) { if (abierto !== null) out[abierto].ancho = true; abierto = null }
    else abierto = abierto === null ? i : null
  })
  if (abierto !== null) out[abierto].ancho = true
  return out
}

function Panel({ titulo, ancho, children }) {
  return (
    <section className={`nexo-card nexo-panel${ancho ? ' est-ancho' : ''}`}>
      <div className="nexo-panel-head"><h3 className="nexo-panel-title">{titulo}</h3></div>
      {children}
    </section>
  )
}

function Grafico({ g, ancho }) {
  switch (g.tipo) {
    case 'linea':
      return <Panel titulo={g.titulo} ancho>{g.series.some((s) => s.valores.some(Boolean)) ? <GraficoLinea dias={g.dias} series={g.series} /> : <Vacio />}</Panel>
    case 'medidor':
      return <Panel titulo={g.titulo} ancho={ancho}><Medidor valor={g.valor} detalle={g.detalle} /></Panel>
    case 'calor':
      return <Panel titulo={g.titulo} ancho>{g.celdas.flat().some(Boolean) ? <MapaCalor celdas={g.celdas} /> : <Vacio />}</Panel>
    case 'columnas':
      return <Panel titulo={g.titulo} ancho={ancho}>{g.categorias.length ? <Columnas categorias={g.categorias} series={g.series} /> : <Vacio />}</Panel>
    case 'mosaico':
      return <Panel titulo={g.titulo} ancho>{g.data.length ? <Mosaico data={g.data} /> : <Vacio />}</Panel>
    default:
      if (!g.data.length) return <Panel titulo={g.titulo} ancho={ancho}><Vacio /></Panel>
      // Clic en una parte: no hay listado debajo que filtrar, así que solo resalta.
      return <div className={ancho ? 'est-ancho' : undefined}><GraficoCategorias g={g} /></div>
  }
}

function GraficoCategorias({ g }) {
  const [activo, setActivo] = useState(null)
  return <InformeGrafico titulo={g.titulo} data={g.data} activo={activo} onSelect={(v) => setActivo((a) => (a === v ? null : v))} />
}

function Lista({ lista, ancho }) {
  return (
    <section className={`nexo-card nexo-panel${ancho ? ' est-ancho' : ''}`}>
      <div className="nexo-panel-head"><h3 className="nexo-panel-title">{lista.titulo}</h3></div>
      {lista.items.length === 0 ? <Vacio texto="Nada por mostrar" /> : (
        <ol className="est-lista">
          {lista.items.map((it, i) => (
            <li key={i}>
              {it.valor != null && <span className="est-lista-pos">{i + 1}</span>}
              <span className="est-lista-texto">
                <strong title={it.principal}>{it.principal}</strong>
                {(it.secundario || it.fecha) && (
                  <span>{[it.secundario, it.fecha && new Date(it.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })].filter(Boolean).join(' · ')}</span>
                )}
              </span>
              {it.valor != null && <span className="est-lista-valor">{numero(it.valor)}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// Administrador > Estadísticas: menú General / una aplicación + periodo; cifras
// con comparación contra el periodo anterior, gráficos y listas (todo lo arma la API).
export default function Estadisticas() {
  const [app, setApp] = useState('general')
  const [dias, setDias] = useState(30)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const pedido = useRef(0)

  useEffect(() => {
    const id = ++pedido.current
    fetchEstadisticas({ app, dias })
      .then((r) => { if (id === pedido.current) { setDatos(r); setError('') } })
      .catch((e) => { if (id === pedido.current) setError(e.message) })
      .finally(() => { if (id === pedido.current) setCargando(false) })
  }, [app, dias])

  const elegir = (cambio) => { setCargando(true); cambio() }
  const actual = APPS.find((a) => a.key === app)
  const vigente = datos && datos.app === app && datos.dias === dias ? datos : null

  return (
    <div className="nexo-home est-page">
      <div className="nexo-home-header">
        <div>
          <h1>Estadísticas</h1>
          <p>{actual.desc}.</p>
        </div>
        <div className="nexo-range-tabs" role="tablist" aria-label="Periodo">
          {PERIODOS.map(([d, label]) => (
            <button key={d} type="button" role="tab" aria-selected={dias === d} className={dias === d ? 'active' : undefined}
              onClick={() => elegir(() => setDias(d))}>{label}</button>
          ))}
        </div>
      </div>

      <nav className="est-apps" aria-label="Aplicación">
        {APPS.map(({ key, label, icon: Icono }) => (
          <button key={key} type="button" className={app === key ? 'activa' : undefined} aria-pressed={app === key}
            onClick={() => elegir(() => setApp(key))}>
            <Icono size={17} strokeWidth={1.75} /> {label}
          </button>
        ))}
      </nav>

      {error && <div className="reportes-error">{error}</div>}

      {!vigente && cargando ? (
        <div className="loading-box"><span className="loader"></span>Cargando estadísticas...</div>
      ) : (datos && (
        <div className={`est-contenido${cargando ? ' est-actualizando' : ''}`}>
          <div className="nexo-kpi-row">
            {datos.kpis.map((k, i) => <Cifra key={k.label} kpi={k} i={i} />)}
          </div>
          <div className="est-graficos">
            {repartir([
              ...datos.graficos.map((g) => ({ g, ancho: ANCHOS.includes(g.tipo) })),
              ...datos.listas.map((l) => ({ l, ancho: false })),
            ]).map(({ g, l, ancho }) => (g
              ? <Grafico key={`${datos.app}-${g.titulo}`} g={g} ancho={ancho} />
              : <Lista key={`${datos.app}-${l.titulo}`} lista={l} ancho={ancho} />))}
          </div>
        </div>
      ))}
    </div>
  )
}
