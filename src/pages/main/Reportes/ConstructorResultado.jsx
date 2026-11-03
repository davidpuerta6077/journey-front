import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, ExternalLink, X, AlertTriangle, Columns3 } from 'lucide-react'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import ExportMenu from '../../../components/ExportMenu'
import Paginacion from '../../../components/Paginacion'
import { STATUS } from '../../../components/charts/palette'
import InformeGrafico from './InformeGrafico'
import GrupoChip from './GrupoChip'

// Texto de una celda: el mismo para la tabla, el filtro estilo Excel y la exportación.
const textoCelda = (v) => (v === null || v === undefined ? '' : v === true ? 'Sí' : v === false ? 'No' : String(v))
const SIN_VALOR = '(sin dato)'
const COLUMNAS_COMPACTAS = 7
const MAX_FILTROS_RAPIDOS = 4
// Columnas que conviene ofrecer primero como filtro rápido.
const PREFERIDAS = /periodo|programa|asignatura|jornada|estado|tipo|nivel|grupo|departamento|rol/
const COLOR_RIESGO = { Alto: STATUS.error, Medio: STATUS.warn, Bajo: '#c9a227', 'Sin riesgo': STATUS.ok }

function comparar(a, b) {
  if (a == null || a === '') return 1
  if (b == null || b === '') return -1
  const na = Number(a), nb = Number(b)
  if (typeof a !== 'boolean' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return String(a).localeCompare(String(b), 'es', { numeric: true })
}

function contar(rows, key) {
  const m = new Map()
  for (const r of rows) {
    const k = textoCelda(r[key]) || SIN_VALOR
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor)
}

const num = (n) => n.toLocaleString('es-CO')
const pct = (n, total) => `${((n / (total || 1)) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

// Resultado del constructor presentado como informe: filtros rápidos, cifras
// clave, gráficos (uno por columna de `agrupar`) y el listado compacto.
// `destinoListado`: nodo donde se dibuja el listado (debajo del panel y a todo
// el ancho); sin él, va al final de este mismo bloque.
export default function ConstructorResultado({ titulo, sustantivo = 'filas', columns, rows, agrupar = [], avisos = [], destinoListado }) {
  const [rapidos, setRapidos] = useState({})          // { colKey: valor }
  const [drill, setDrill] = useState(null)            // { col, valor, rows }
  const [todasLasColumnas, setTodasLasColumnas] = useState(false)
  const [orden, setOrden] = useState({ key: null, dir: 'asc' })
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)

  // Filtros rápidos: columnas de texto con pocos valores distintos (se calculan del resultado).
  const opcionesRapidas = useMemo(() => columns
    .filter((c) => !['Moodle', 'Riesgo'].includes(c.grupo) && (c.tipo === 'texto' || c.tipo === 'bool'))
    .map((c) => ({ col: c, valores: contar(rows, c.key) }))
    .filter((o) => o.valores.length >= 2 && o.valores.length <= 60)
    .sort((a, b) => Number(PREFERIDAS.test(b.col.key)) - Number(PREFERIDAS.test(a.col.key)))
    .slice(0, MAX_FILTROS_RAPIDOS), [columns, rows])

  const rapidosActivos = Object.entries(rapidos).filter(([k, v]) => v && opcionesRapidas.some((o) => o.col.key === k))
  const claveRapidos = JSON.stringify(rapidosActivos)
  const filtradas = useMemo(() => {
    const activos = JSON.parse(claveRapidos)
    return activos.length ? rows.filter((r) => activos.every(([k, v]) => (textoCelda(r[k]) || SIN_VALOR) === v)) : rows
  }, [rows, claveRapidos])

  const drillActivo = drill && drill.rows === filtradas ? drill : null
  const base = useMemo(() => (drillActivo
    ? filtradas.filter((r) => (textoCelda(r[drillActivo.col]) || SIN_VALOR) === drillActivo.valor)
    : filtradas), [filtradas, drillActivo])

  const visiblesCols = todasLasColumnas ? columns : columns.slice(0, COLUMNAS_COMPACTAS)
  const getters = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, (r) => textoCelda(r[c.key])])), [columns])
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(base, getters, () => setPagina(1))

  const ordenadas = useMemo(() => (orden.key
    ? [...filtered].sort((a, b) => comparar(a[orden.key], b[orden.key]) * (orden.dir === 'asc' ? 1 : -1))
    : filtered), [filtered, orden])

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const pageRows = ordenadas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina)

  const graficos = agrupar.map((k) => columns.find((c) => c.key === k)).filter(Boolean).slice(0, 2)
  const principal = graficos[0] ? contar(filtradas, graficos[0].key) : []

  const elegir = (col, valor) => {
    setDrill(drillActivo?.col === col && drillActivo.valor === valor ? null : { col, valor, rows: filtradas })
    setPagina(1)
  }
  const ordenarPor = (key) => {
    setOrden((o) => ({ key, dir: o.key === key && o.dir === 'asc' ? 'desc' : 'asc' }))
    setPagina(1)
  }

  // En el archivo, una etiqueta repetida en dos grupos lleva el grupo entre paréntesis.
  const repetida = (c) => columns.filter((x) => x.label === c.label).length > 1
  const exportCols = columns.map((c) => ({ label: repetida(c) ? `${c.label} (${c.grupo})` : c.label, get: (r) => textoCelda(r[c.key]) }))
  const colDrill = drillActivo && columns.find((c) => c.key === drillActivo.col)
  const Sustantivo = sustantivo.charAt(0).toUpperCase() + sustantivo.slice(1)

  return (
    <div className="inf">
      {avisos.map((a) => (
        <div key={a} className="crep-aviso" role="status"><AlertTriangle size={16} /> <span>{a}</span></div>
      ))}

      {opcionesRapidas.length > 0 && (
        <div className="inf-rapidos">
          {opcionesRapidas.map(({ col, valores }) => (
            <label key={col.key} className="inf-rapido">
              <span>{col.label}</span>
              <select value={rapidos[col.key] || ''} onChange={(e) => { setRapidos({ ...rapidos, [col.key]: e.target.value }); setPagina(1) }}>
                <option value="">Todos</option>
                {valores.map((v) => <option key={v.nombre} value={v.nombre}>{v.nombre} ({num(v.valor)})</option>)}
              </select>
            </label>
          ))}
          {rapidosActivos.length > 0 && <button type="button" className="btn-secondary" onClick={() => setRapidos({})}>Quitar filtros</button>}
        </div>
      )}

      <div className="inf-cifras">
        <div className="inf-cifra inf-cifra-total">
          <strong>{num(filtradas.length)}</strong>
          <span>{Sustantivo}</span>
        </div>
        {graficos[0] && principal.slice(0, 3).map((d) => (
          <button key={d.nombre} type="button" className={`inf-cifra${drillActivo?.col === graficos[0].key && drillActivo.valor === d.nombre ? ' activa' : ''}`}
            onClick={() => elegir(graficos[0].key, d.nombre)} title="Ver solo estas filas en el listado">
            <strong style={COLOR_RIESGO[d.nombre] ? { color: COLOR_RIESGO[d.nombre] } : undefined}>{num(d.valor)}</strong>
            <span title={d.nombre}>{d.nombre}</span>
            <small>{pct(d.valor, filtradas.length)} · {graficos[0].label}</small>
          </button>
        ))}
      </div>

      {graficos.length > 0 && filtradas.length > 0 && (
        <div className="inf-graficos">
          {graficos.map((c) => (
            <InformeGrafico
              key={c.key}
              titulo={`${Sustantivo} por ${c.label.toLowerCase()}`}
              data={contar(filtradas, c.key)}
              activo={drillActivo?.col === c.key ? drillActivo.valor : null}
              onSelect={(v) => elegir(c.key, v)}
            />
          ))}
        </div>
      )}

      {(() => { const listado = (
      <section className="inf-listado">
        <header className="inf-listado-head">
          <div>
            <h2>Listado</h2>
            <span className="inf-sub">
              {ordenadas.length === filtradas.length ? `${num(filtradas.length)} ${sustantivo}` : `${num(ordenadas.length)} de ${num(filtradas.length)} ${sustantivo}`}
            </span>
          </div>
          <div className="inf-listado-tools">
            {drillActivo && (
              <span className="tabla-detalle-chip">
                {colDrill?.label}: {drillActivo.valor}
                <button type="button" onClick={() => setDrill(null)} title="Quitar filtro" aria-label="Quitar filtro"><X size={13} /></button>
              </span>
            )}
            {anyFilter && <button type="button" className="btn-secondary" onClick={clearFilters}>Limpiar filtros de columnas</button>}
            {columns.length > COLUMNAS_COMPACTAS && (
              <button type="button" className="btn-secondary" onClick={() => setTodasLasColumnas((v) => !v)}>
                <Columns3 size={15} /> {todasLasColumnas ? 'Ver menos columnas' : `Ver las ${columns.length} columnas`}
              </button>
            )}
            <ExportMenu title={titulo} columns={exportCols} rows={ordenadas} allRows={rows} />
          </div>
        </header>

        <div className="reportes-tabla-scroll">
          <table className="reportes-tabla inf-tabla">
            <thead>
              <tr>
                {visiblesCols.map((c) => (
                  <th key={c.key} className="sortable" onClick={() => ordenarPor(c.key)} title={`${c.label} · ${c.grupo}`}>
                    <ColumnFilter {...colProps(c.key)}>
                      {c.label}
                      {orden.key === c.key
                        ? orden.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                    </ColumnFilter>
                    <GrupoChip grupo={c.grupo} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={visiblesCols.length || 1} className="tabla-detalle-vacio">
                  {rows.length === 0 ? 'No hay datos con estos filtros' : 'Ninguna fila coincide con los filtros'}
                </td></tr>
              ) : pageRows.map((row, i) => (
                <tr key={i}>
                  {visiblesCols.map((c) => {
                    const v = row[c.key]
                    const texto = textoCelda(v)
                    return (
                      <td data-label={c.label} key={c.key} title={texto.length > 30 ? texto : undefined}>
                        {typeof v === 'string' && v.startsWith('http')
                          ? <a href={v} target="_blank" rel="noopener noreferrer" className="expand-link">Abrir <ExternalLink size={12} /></a>
                          : c.key === 'riesgo_nivel' && v
                            ? <span className="crep-nivel" style={{ '--nivel': COLOR_RIESGO[v] || STATUS.neutral }}>{v}</span>
                            : texto || <span className="inf-vacio">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Paginacion page={paginaActual} totalPages={totalPaginas} total={ordenadas.length} perPage={porPagina} onPage={setPagina} onPerPage={(n) => { setPorPagina(n); setPagina(1) }} />
      </section>
      ); return destinoListado ? createPortal(listado, destinoListado) : listado })()}
    </div>
  )
}
