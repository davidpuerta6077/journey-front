import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import Paginacion from '../../../components/Paginacion'
import { fetchSicauNovedades } from '../../../services/matriculas/fetchSicauNovedades'

// Novedades tal como las reporta SICAU (ya calculadas de su lado). Solo
// lectura: la lógica de Nexo sigue por `estado`; esto muestra el "por qué"
// que manda SICAU. Un RETIRO de curso sí desmatricula a sus estudiantes
// (lo hace la API al recibirlo) y aquí se ve cuántos.
const TIPOS = {
  CAMBIO_DE_GRUPO:  { label: 'Cambio de grupo',  cls: 'badge-novedad' },
  CAMBIO_DE_ESTADO: { label: 'Cambio de estado', cls: 'badge-pending' },
  RETIRO:           { label: 'Retiro de curso',  cls: 'badge-error' },
}

const humanize = (s) => {
  const t = String(s || '').replace(/_/g, ' ').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const tipoInfo = (tipo) => TIPOS[tipo] || { label: humanize(tipo) || 'Sin tipo', cls: 'badge-pending' }

function describirCambio(n) {
  const cambios = Array.isArray(n.cambios) ? n.cambios : []
  if (cambios.length > 0) {
    return cambios.map(c => `${humanize(c.campo)}: ${c.anterior ?? '—'} → ${c.actual ?? '—'}`).join(' · ')
  }
  return n.motivo ? humanize(n.motivo) : '—'
}

const formatFecha = (f) => new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export default function NovedadesSicau() {
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [page, setPage]             = useState(1)
  const [perPage, setPerPage]       = useState(10)

  useEffect(() => {
    fetchSicauNovedades()
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const tiposPresentes = useMemo(() => [...new Set(rows.map(r => r.tipo).filter(Boolean))], [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r =>
      (!filterTipo || r.tipo === filterTipo) &&
      (!q || [r.codigo_journey, r.nombre_asignatura, r.cedula, r.nombre_estudiante, r.usuario_sicau]
        .some(v => String(v || '').toLowerCase().includes(q)))
    )
  }, [rows, search, filterTipo])

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
        <select className="filter-select" value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1) }} aria-label="Tipo de novedad">
          <option value="">Todos los tipos de novedad</option>
          {tiposPresentes.map(t => <option key={t} value={t}>{tipoInfo(t).label}</option>)}
        </select>
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
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Curso</th>
                  <th>Estudiante</th>
                  <th>Cambio reportado</th>
                  <th>Resultado en Nexo</th>
                  <th>Enviado por</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Aún no han llegado novedades de SICAU.</td></tr>
                ) : paginated.map(n => {
                  const tipo = tipoInfo(n.tipo)
                  return (
                    <tr key={n.id}>
                      <td data-label="Fecha">{formatFecha(n.fecha)}</td>
                      <td data-label="Tipo"><span className={`badge ${tipo.cls}`}>{tipo.label}</span></td>
                      <td data-label="Curso">
                        {n.nombre_asignatura || n.codigo_asignatura || '—'}
                        <div className="novedades-sicau-sub">{n.codigo_journey}</div>
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
