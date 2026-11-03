import { useSyncExternalStore } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CATEGORICAL, STATUS } from '../../../components/charts/palette'

// Colores fijos para valores con significado (nivel de riesgo, sí/no).
const COLOR_VALOR = { Alto: STATUS.error, Medio: STATUS.warn, Bajo: '#c9a227', 'Sin riesgo': STATUS.ok, 'Sí': STATUS.ok, No: STATUS.neutral }
const MAX_DONA = 6
const MAX_BARRAS = 10
const MARCA = '#5b7cfa'

const colorValor = (nombre, i) => COLOR_VALOR[nombre] || CATEGORICAL[i] || STATUS.neutral

// Tema actual (data-theme en <html>), para que los textos del SVG se lean en oscuro.
function suscribirTema(cb) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}
const leerTema = () => document.documentElement.getAttribute('data-theme') === 'dark'

const recortar = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function Ayuda({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const { nombre, valor } = payload[0].payload
  return (
    <div className="inf-tooltip">
      <strong>{nombre}</strong>
      <span>{valor.toLocaleString('es-CO')} · {((valor / total) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %</span>
    </div>
  )
}

// Un gráfico del informe. data = [{ nombre, valor }] ordenado de mayor a menor.
// Hasta 6 categorías: dona con leyenda; más: barras horizontales con las 10 mayores.
// Clic en una porción, barra o fila de la leyenda = onSelect(nombre).
export default function InformeGrafico({ titulo, subtitulo, data, activo, onSelect }) {
  const oscuro = useSyncExternalStore(suscribirTema, leerTema)
  const tinta = oscuro ? '#cbd5e1' : '#4b5563'
  const grilla = oscuro ? '#334155' : '#e5e7eb'
  // En celular el eje de nombres se angosta para que las barras tengan espacio.
  const angosto = window.innerWidth < 600
  const total = data.reduce((s, d) => s + d.valor, 0)
  const dona = data.length <= MAX_DONA
  const barras = data.slice(0, MAX_BARRAS)
  const opacidad = (nombre) => (activo && activo !== nombre ? 0.35 : 1)

  return (
    <figure className="inf-grafico">
      <figcaption>
        <strong>{titulo}</strong>
        <span>{subtitulo || (data.length > MAX_BARRAS ? `Las ${MAX_BARRAS} mayores de ${data.length}` : `${data.length} ${data.length === 1 ? 'categoría' : 'categorías'}`)}</span>
      </figcaption>

      {dona ? (
        <div className="inf-dona">
          <div className="inf-dona-svg">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius="62%" outerRadius="92%" paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none" onClick={(e) => onSelect(e.nombre)} cursor="pointer" isAnimationActive={false}>
                  {data.map((d, i) => <Cell key={d.nombre} fill={colorValor(d.nombre, i)} fillOpacity={opacidad(d.nombre)} />)}
                </Pie>
                <Tooltip content={<Ayuda total={total} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="inf-dona-centro" aria-hidden="true">
              <strong>{total.toLocaleString('es-CO')}</strong><span>total</span>
            </div>
          </div>
          <ul className="inf-leyenda">
            {data.map((d, i) => (
              <li key={d.nombre}>
                <button type="button" className={activo === d.nombre ? 'activa' : undefined} onClick={() => onSelect(d.nombre)} aria-pressed={activo === d.nombre}>
                  <span className="inf-leyenda-dot" style={{ background: colorValor(d.nombre, i) }} />
                  <span className="inf-leyenda-nombre" title={d.nombre}>{d.nombre}</span>
                  <span className="inf-leyenda-valor">{d.valor.toLocaleString('es-CO')}</span>
                  <span className="inf-leyenda-pct">{((d.valor / total) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : angosto ? (
        // En celular: nombre completo arriba y barra debajo (el eje de recharts no cabe).
        <ul className="inf-barras-lista">
          {barras.map((d) => (
            <li key={d.nombre}>
              <button type="button" className={activo === d.nombre ? 'activa' : undefined} onClick={() => onSelect(d.nombre)} aria-pressed={activo === d.nombre}>
                <span className="inf-barras-nombre">{d.nombre}</span>
                <span className="inf-barras-fila">
                  <span className="inf-barras-pista">
                    <span style={{ width: `${(d.valor / barras[0].valor) * 100}%`, background: COLOR_VALOR[d.nombre] || MARCA }} />
                  </span>
                  <strong>{d.valor.toLocaleString('es-CO')}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="inf-barras" style={{ height: barras.length * 34 + 30 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barras} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap="22%">
              <CartesianGrid horizontal={false} stroke={grilla} strokeDasharray="2 4" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: tinta, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString('es-CO')} />
              <YAxis type="category" dataKey="nombre" width={190} tick={{ fill: tinta, fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => recortar(String(v), 28)} interval={0} />
              <Tooltip content={<Ayuda total={total} />} cursor={{ fill: oscuro ? '#ffffff10' : '#5b7cfa12' }} />
              <Bar dataKey="valor" onClick={(e) => onSelect(e.nombre)} cursor="pointer" isAnimationActive={false}
                label={{ position: 'right', fill: tinta, fontSize: 12, formatter: (v) => v.toLocaleString('es-CO') }}>
                {barras.map((d) => <Cell key={d.nombre} fill={COLOR_VALOR[d.nombre] || MARCA} fillOpacity={opacidad(d.nombre)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  )
}
