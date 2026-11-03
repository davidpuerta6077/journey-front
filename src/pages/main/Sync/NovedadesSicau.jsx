import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Paginacion from '../../../components/Paginacion'
import ColumnFilter from '../../../components/ColumnFilter'
import useColumnFilters from '../../../components/useColumnFilters'
import ExportMenu from '../../../components/ExportMenu'
import { fetchSicauNovedades } from '../../../services/matriculas/fetchSicauNovedades'
import { humanize, nombreNovedadSicau, claseNovedad, NIVEL_LABEL } from './novedadNombres'

// Novedades tal como las reporta SICAU (ya calculadas de su lado). Solo
// lectura: la lógica de Nexo sigue por `estado`; esto muestra el "por qué"
// que manda SICAU. Un RETIRO de curso sí desmatricula a sus estudiantes
// (lo hace la API al recibirlo) y aquí se ve cuántos.

function describirCambio(n) {
  const cambios = Array.isArray(n.cambios) ? n.cambios : []
  if (cambios.length > 0) {
    return cambios.map(c => `${humanize(c.campo)}: ${c.anterior ?? '—'} → ${c.actual ?? '—'}`).join(' · ')
  }
  return n.motivo ? humanize(n.motivo) : '—'
}

const formatFecha = (f) => new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

// Texto de cada columna tal como se ve en la celda (para el filtro por columna).
const COL_GETTERS = {
  fecha:      n => formatFecha(n.fecha),
  tipo:       n => nombreNovedadSicau(n),
  curso:      n => n.nivel === 'usuario' ? 'Cuenta de usuario' : (n.nombre_asignatura || n.codigo_asignatura || '—'),
  estudiante: n => n.nivel === 'curso' ? 'Todo el curso' : (n.nombre_estudiante || n.cedula || '—'),
  cambio:     n => describirCambio(n),
  resultado:  n => n.resultado || (n.nivel === 'curso' ? '—' : 'Según el estado de la matrícula'),
  enviado:    n => n.usuario_sicau || '—',
}
// Columnas para exportar (mismo texto de la celda, con el título del encabezado).
const EXPORT_COLUMNS = Object.entries({ fecha: 'Fecha', tipo: 'Tipo', curso: 'Curso', estudiante: 'Estudiante', cambio: 'Cambio reportado', resultado: 'Resultado en Nexo', enviado: 'Enviado por' }).map(([k, label]) => ({ label, get: COL_GETTERS[k] }))

export default function NovedadesSicau() {
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterTipo, setFilterTipo]   = useState('')
  // ?nivel=matricula llega desde la notificación agrupada de SICAU.
  const [searchParams] = useSearchParams()
  const nivelParam = searchParams.get('nivel')
  const [filterNivel, setFilterNivel] = useState(nivelParam || '')
  const [prevNivelParam, setPrevNivelParam] = useState(nivelParam)
  if (nivelParam !== prevNivelParam) {
    setPrevNivelParam(nivelParam)
    setFilterNivel(nivelParam || '')
  }
  const [page, setPage]             = useState(1)
  const [perPage, setPerPage]       = useState(10)

  useEffect(() => {
    fetchSicauNovedades()
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const tiposPresentes  = useMemo(() => [...new Set(rows.map(nombreNovedadSicau))], [rows])
  const nivelesPresentes = useMemo(() => [...new Set(rows.map(r => r.nivel))], [rows])

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r =>
      (!filterTipo || nombreNovedadSicau(r) === filterTipo) &&
      (!filterNivel || r.nivel === filterNivel) &&
      (!q || [r.codigo_journey, r.nombre_asignatura, r.cedula, r.nombre_estudiante, r.usuario_sicau]
        .some(v => String(v || '').toLowerCase().includes(q)))
    )
  }, [rows, search, filterTipo, filterNivel])

  // Filtros por columna (estilo Excel) sobre lo que ya dejó pasar la barra de filtros.
  const { filtered, colProps, anyFilter, clearFilters } = useColumnFilters(baseFiltered, COL_GETTERS, () => setPage(1))

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
        Novedades tal como las reporta SICAU (cambio de grupo, cambio de estado, retiro de curso). Son informativas:
        Nexo aplica los cambios según el estado de cada matrícula. Un retiro de curso desmatricula a sus estudiantes activos.
      </p>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por código, asignatura, cédula, estudiante..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterNivel} onChange={e => { setFilterNivel(e.target.value); setPage(1) }} aria-label="Nivel de la novedad">
          <option value="">Todos los niveles</option>
          {nivelesPresentes.map(n => <option key={n} value={n}>{NIVEL_LABEL[n] || humanize(n)}</option>)}
        </select>
        <select className="filter-select" value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1) }} aria-label="Tipo de novedad">
          <option value="">Todos los tipos de novedad</option>
          {tiposPresentes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {anyFilter && <button className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>}
        <ExportMenu title="Novedades SICAU" columns={EXPORT_COLUMNS} rows={filtered} allRows={rows} />
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando novedades de SICAU...</div>
      ) : error ? (
        <p className="user-detail-empty">{error}</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th><ColumnFilter label="Fecha" {...colProps('fecha')} /></th>
                  <th><ColumnFilter label="Tipo" {...colProps('tipo')} /></th>
                  <th><ColumnFilter label="Curso" {...colProps('curso')} /></th>
                  <th><ColumnFilter label="Estudiante" {...colProps('estudiante')} /></th>
                  <th><ColumnFilter label="Cambio reportado" {...colProps('cambio')} /></th>
                  <th><ColumnFilter label="Resultado en Nexo" {...colProps('resultado')} /></th>
                  <th><ColumnFilter label="Enviado por" {...colProps('enviado')} /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Aún no han llegado novedades de SICAU.</td></tr>
                ) : paginated.map(n => {
                  const tipo = nombreNovedadSicau(n)
                  return (
                    <tr key={n.id}>
                      <td data-label="Fecha">{formatFecha(n.fecha)}</td>
                      <td data-label="Tipo"><span className={`badge ${claseNovedad(tipo)}`}>{tipo}</span></td>
                      <td data-label="Curso">
                        {n.nivel === 'usuario'
                          ? <span className="novedades-sicau-sub">Cuenta de usuario</span>
                          : <>{n.nombre_asignatura || n.codigo_asignatura || '—'}<div className="novedades-sicau-sub">{n.codigo_journey}</div></>}
                      </td>
                      <td data-label="Estudiante">
                        {n.nivel === 'curso' ? <span className="novedades-sicau-sub">Todo el curso</span> : (n.nombre_estudiante || n.cedula || '—')}
                        {n.nivel !== 'curso' && n.nombre_estudiante && <div className="novedades-sicau-sub">{n.cedula}</div>}
                      </td>
                      <td data-label="Cambio reportado">{describirCambio(n)}</td>
                      <td data-label="Resultado en Nexo">{n.resultado || (n.nivel === 'curso' ? '—' : 'Según el estado de la matrícula')}</td>
                      <td data-label="Enviado por">{n.usuario_sicau || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={x => { setPerPage(x); setPage(1) }} />
        </>
      )}
    </>
  )
}
