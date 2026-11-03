import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Treemap } from 'recharts'
import { CATEGORICAL } from '../../../components/charts/palette'
import useTemaOscuro from './temaOscuro'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const num = (v) => Number(v || 0).toLocaleString('es-CO')

// Medidor semicircular para un porcentaje (0-100). valor null = sin datos.
export function Medidor({ valor, detalle }) {
  const r = 80
  const largo = Math.PI * r
  const lleno = valor == null ? 0 : (Math.min(100, Math.max(0, valor)) / 100) * largo
  return (
    <div className="est-medidor">
      <svg viewBox="0 0 200 116" role="img" aria-label={valor == null ? 'Sin datos' : `${valor} %`}>
        <defs>
          <linearGradient id="est-medidor-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b7cfa" />
            <stop offset="100%" stopColor="#9b6cff" />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" className="est-medidor-pista" strokeWidth="18" strokeLinecap="round" />
        {lleno > 0 && (
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#est-medidor-grad)" strokeWidth="18" strokeLinecap="round"
            strokeDasharray={`${lleno} ${largo}`} />
        )}
      </svg>
      <div className="est-medidor-valor">
        <strong>{valor == null ? '—' : `${valor} %`}</strong>
        <span>{detalle}</span>
      </div>
    </div>
  )
}

// Mapa de calor día de la semana × hora. celdas = [7][24] (lunes primero).
export function MapaCalor({ celdas, unidad = 'acciones' }) {
  const max = Math.max(1, ...celdas.flat())
  let pico = { d: 0, h: 0, n: 0 }
  celdas.forEach((fila, d) => fila.forEach((n, h) => { if (n > pico.n) pico = { d, h, n } }))
  const porDia = celdas.map((fila) => fila.reduce((a, b) => a + b, 0))
  const diaPico = porDia.indexOf(Math.max(...porDia))
  return (
    <>
      <div className="est-calor" role="table" aria-label="Actividad por día y hora">
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="est-calor-hora">{h % 3 === 0 ? `${h}h` : ''}</span>)}
        {celdas.map((fila, d) => (
          <div key={d} className="est-calor-fila" role="row">
            <span className="est-calor-dia">{DIAS[d].slice(0, 3)}</span>
            {fila.map((n, h) => (
              <span key={h} className="est-calor-celda" role="cell"
                style={{ '--i': n ? 0.12 + (n / max) * 0.88 : 0 }}
                title={`${DIAS[d]} ${h}:00 · ${num(n)} ${unidad}`} />
            ))}
          </div>
        ))}
      </div>
      {pico.n > 0 && (
        <p className="est-calor-resumen">
          Hora pico: <strong>{DIAS[pico.d].toLowerCase()} a las {pico.h}:00</strong> ({num(pico.n)}) · Día con más movimiento: <strong>{DIAS[diaPico].toLowerCase()}</strong>
          <span className="est-calor-escala" aria-hidden="true">menos <i /> más</span>
        </p>
      )}
    </>
  )
}

function AyudaColumnas({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="inf-tooltip">
      <strong>{label}</strong>
      {payload.map((p) => <span key={p.dataKey}><i className="est-dot" style={{ background: p.color }} /> {p.name}: {num(p.value)}</span>)}
    </div>
  )
}

// Columnas verticales (agrupadas si hay varias series).
export function Columnas({ categorias, series }) {
  const oscuro = useTemaOscuro()
  const tinta = oscuro ? '#cbd5e1' : '#6b7694'
  const data = categorias.map((c, i) => Object.fromEntries([['c', c], ...series.map((s) => [s.nombre, s.valores[i]])]))
  return (
    <>
      <div className="est-columnas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={4} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={oscuro ? '#334155' : '#e3e7f3'} strokeDasharray="3 4" />
            <XAxis dataKey="c" tick={{ fill: tinta, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: tinta, fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={num} />
            <Tooltip content={<AyudaColumnas />} cursor={{ fill: oscuro ? '#ffffff10' : '#5b7cfa12' }} />
            {series.map((s, i) => (
              <Bar key={s.nombre} dataKey={s.nombre} name={s.nombre} fill={CATEGORICAL[i % CATEGORICAL.length]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && (
        <ul className="est-linea-leyenda">
          {series.map((s, i) => (
            <li key={s.nombre}><i className="est-dot" style={{ background: CATEGORICAL[i % CATEGORICAL.length] }} /><span>{s.nombre}</span>
              <strong>{num(s.valores.reduce((a, b) => a + b, 0))}</strong></li>
          ))}
        </ul>
      )}
    </>
  )
}

// Rectángulo del mosaico: color por posición y texto solo si cabe.
function Bloque({ x, y, width, height, index, name, value }) {
  if (width <= 0 || height <= 0) return null
  const color = CATEGORICAL[index % CATEGORICAL.length]
  const cabe = width > 70 && height > 34
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.88 - (index % 5) * 0.1} stroke="var(--bg-surface, #fff)" strokeWidth={2} />
      {cabe && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight={600}>
            {name.length > width / 7 ? `${name.slice(0, Math.max(4, Math.floor(width / 7) - 1))}…` : name}
          </text>
          <text x={x + 8} y={y + 34} fill="#ffffffcc" fontSize={11}>{num(value)}</text>
        </>
      )}
    </g>
  )
}

function AyudaMosaico({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload
  return (
    <div className="inf-tooltip">
      <strong>{name}</strong>
      <span>{num(value)} · {((value / total) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %</span>
    </div>
  )
}

// Mosaico (treemap): el área de cada bloque es proporcional a su valor.
export function Mosaico({ data }) {
  const total = data.reduce((a, d) => a + d.valor, 0)
  return (
    <div className="est-mosaico">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={data.map((d) => ({ name: d.nombre, value: d.valor }))} dataKey="value" aspectRatio={2} isAnimationActive={false} content={<Bloque />}>
          <Tooltip content={<AyudaMosaico total={total} />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
