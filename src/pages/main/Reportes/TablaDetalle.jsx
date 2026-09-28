import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download, ExternalLink, Search, X } from 'lucide-react'
import { exportarExcel } from './exportarExcel'

const POR_PAGINA = 25
const ES_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function formatear(v) {
  if (v == null || v === '') return '—'
  if (v === true) return 'Sí'
  if (v === false) return 'No'
  if (typeof v === 'string' && ES_FECHA_HORA.test(v)) {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
  }
  return typeof v === 'number' ? v.toLocaleString('es-CO') : String(v)
}

function comparar(a, b) {
  if (a == null) return 1
  if (b == null) return -1
  const na = Number(a), nb = Number(b)
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return String(a).localeCompare(String(b), 'es', { numeric: true })
}

// Tabla del detalle de un reporte (las filas reales: qué cursos, qué
// estudiantes...). Búsqueda en todas las columnas, orden por columna,
// paginación y descarga a Excel de lo que se está viendo (filtro + búsqueda).
// Una columna con `link: '<clave>'` se muestra como enlace a row[clave].
// `filtro` ({ label, fn }) viene del clic en un KPI o gráfico del dashboard.
export default function TablaDetalle({ titulo, columns = [], rows = [], filtro, onQuitarFiltro, nombreArchivo }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState({ key: null, dir: 'asc' })
  const [pagina, setPagina] = useState(1)

  const visibles = useMemo(() => {
    let data = filtro ? rows.filter(filtro.fn) : rows
    const q = busqueda.trim().toLowerCase()
    if (q) data = data.filter((r) => columns.some((c) => formatear(r[c.key]).toLowerCase().includes(q)))
    if (orden.key) {
      data = [...data].sort((a, b) => comparar(a[orden.key], b[orden.key]) * (orden.dir === 'asc' ? 1 : -1))
    }
    return data
  }, [rows, columns, filtro, busqueda, orden])

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const pageRows = visibles.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const ordenarPor = (key) => {
    setOrden((o) => ({ key, dir: o.key === key && o.dir === 'asc' ? 'desc' : 'asc' }))
    setPagina(1)
  }

  return (
    <section className="tabla-detalle">
      <div className="tabla-detalle-header">
        <h2>
          {titulo}
          <span className="tabla-detalle-count">
            {visibles.length === rows.length ? `${rows.length.toLocaleString('es-CO')}` : `${visibles.length.toLocaleString('es-CO')} de ${rows.length.toLocaleString('es-CO')}`}
          </span>
        </h2>
        <div className="tabla-detalle-tools">
          {filtro && (
            <span className="tabla-detalle-chip">
              {filtro.label}
              <button type="button" onClick={onQuitarFiltro} title="Quitar filtro" aria-label="Quitar filtro"><X size={13} /></button>
            </span>
          )}
          <label className="tabla-detalle-search">
            <Search size={14} />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
              placeholder="Buscar en el detalle..."
            />
          </label>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportarExcel({ columns, rows: visibles }, nombreArchivo || titulo)}
            disabled={!visibles.length}
            title="Descargar a Excel lo que se ve en la tabla"
          >
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="reportes-tabla-scroll">
        <table className="reportes-tabla">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="sortable" onClick={() => ordenarPor(c.key)}>
                  {c.label}
                  {orden.key === c.key
                    ? orden.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    : <span style={{ opacity: 0.3 }}><ChevronDown size={13} /></span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={columns.length || 1} className="tabla-detalle-vacio">
                {rows.length === 0 ? 'Sin datos' : 'Ninguna fila coincide con el filtro o la búsqueda'}
              </td></tr>
            ) : pageRows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.link && row[c.link]
                      ? <a href={row[c.link]} target="_blank" rel="noopener noreferrer" className="expand-link">
                          {formatear(row[c.key])} <ExternalLink size={12} />
                        </a>
                      : formatear(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="tabla-detalle-paginacion">
          <button type="button" className="btn-secondary" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual === 1}>Anterior</button>
          <span>Página {paginaActual} de {totalPaginas}</span>
          <button type="button" className="btn-secondary" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>Siguiente</button>
        </div>
      )}
    </section>
  )
}
