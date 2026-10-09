import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import Paginacion from '../../../components/Paginacion'
import { fetchUsers } from '../../../services/usuarios/fetchUsers'
import { fetchSicauNovedades } from '../../../services/matriculas/fetchSicauNovedades'
import { humanize, nombreNovedadSicau } from './novedadNombres'
import { getCached, setCached } from '../../../services/swrCache'

// Misma key que Sync > Usuarios / Módulo Usuarios: mismo preview exactamente.
const CACHE_KEY = 'users-preview'

const ORIGEN_LABEL = { nexo: 'Detectada por Nexo', sicau: 'Reportada por SICAU' }

// Cambios que Nexo detectó solo comparando contra lo que ya tenía guardado
// (ver CAMPOS_NOVEDAD en api/SICAU/controller.js): users.novedad_datos trae
// el último diff de campos (estado, teléfono...), y correo_pendiente es un
// caso aparte porque el correo es el username en Moodle y no se pisa solo.
function describirCambiosNexo(user) {
  const partes = []
  if (user.correo_pendiente) partes.push(`Email: ${user.email || '—'} → ${user.correo_pendiente} (pendiente de aplicar)`)
  if (Array.isArray(user.novedad_datos)) {
    user.novedad_datos.forEach(c => partes.push(`${humanize(c.campo)}: ${c.anterior ?? '—'} → ${c.actual ?? '—'}`))
  }
  return partes.join(' · ') || '—'
}

// Novedad que SICAU ya manda calculada de su lado (objeto `novedad` del
// usuario: NUEVO, cambio de datos...), guardada en sicau_novedades nivel
// "usuario" (ver registrarNovedadUsuario en api/SICAU/controller.js).
function describirCambiosSicau(n) {
  const cambios = Array.isArray(n.cambios) ? n.cambios : []
  if (cambios.length > 0) return cambios.map(c => `${humanize(c.campo)}: ${c.anterior ?? '—'} → ${c.actual ?? '—'}`).join(' · ')
  return n.motivo ? humanize(n.motivo) : '—'
}

const formatFecha = (f) => f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function NovedadesUsuarios() {
  const [users, setUsers]     = useState(() => getCached(CACHE_KEY) || [])
  const [sicauRows, setSicauRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [filterOrigen, setFilterOrigen] = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    Promise.all([fetchUsers(), fetchSicauNovedades()])
      .then(([u, n]) => {
        setCached(CACHE_KEY, u)
        setUsers(u)
        setSicauRows(n.filter(r => r.nivel === 'usuario'))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Un mismo usuario puede tener novedad por las dos vías a la vez (SICAU
  // reportó "NUEVO" al crearlo y, en otro envío, Nexo detectó que cambió el
  // teléfono): se listan como filas separadas, igual que pasa con
  // curso/matrícula en las otras dos pestañas.
  const rows = useMemo(() => {
    const nexoRows = users
      .filter(u => u.novedad_datos?.length > 0 || u.correo_pendiente)
      .map(u => ({
        id: `nexo-${u.id}`,
        fecha: null,
        origen: 'nexo',
        usuario: u.nombre || `${u.firstname || ''} ${u.lastname || ''}`.trim() || '—',
        documento: u.documento,
        cambio: describirCambiosNexo(u),
        enviado_por: 'Aplicado automáticamente',
      }))
    const sicauReportadas = sicauRows.map(n => ({
      id: `sicau-${n.id}`,
      fecha: n.fecha,
      origen: 'sicau',
      usuario: n.nombre_estudiante || n.cedula || '—',
      documento: n.cedula,
      cambio: describirCambiosSicau(n),
      enviado_por: n.usuario_sicau || '—',
      tipo: nombreNovedadSicau(n),
    }))
    return [...nexoRows, ...sicauReportadas]
  }, [users, sicauRows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r =>
      (!filterOrigen || r.origen === filterOrigen) &&
      (!q || [r.usuario, r.documento].some(v => String(v || '').toLowerCase().includes(q)))
    )
  }, [rows, search, filterOrigen])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
        Novedades de usuarios de las dos fuentes: las que Nexo detecta solo al comparar contra lo que ya
        tenía guardado (estado, teléfono, correo personal...) y las que SICAU manda ya calculadas (usuario
        nuevo, cambio de datos). Son informativas; los cambios ya quedaron aplicados.
      </p>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Buscar por nombre, documento..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={filterOrigen} onChange={e => { setFilterOrigen(e.target.value); setPage(1) }} aria-label="Origen de la novedad">
          <option value="">Todos los orígenes</option>
          <option value="nexo">Detectada por Nexo</option>
          <option value="sicau">Reportada por SICAU</option>
        </select>
        <span className="results-count">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="loading-box"><span className="loader"></span>Cargando novedades de usuarios...</div>
      ) : error ? (
        <p className="user-detail-empty">{error}</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Usuario</th>
                  <th>Cambio</th>
                  <th>Enviado por</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No hay novedades de usuarios.</td></tr>
                ) : paginated.map(r => (
                  <tr key={r.id}>
                    <td data-label="Fecha">{formatFecha(r.fecha)}</td>
                    <td data-label="Origen">
                      <span className={`badge ${r.origen === 'nexo' ? 'badge-novedad' : 'badge-moodle'}`}>{ORIGEN_LABEL[r.origen]}</span>
                    </td>
                    <td data-label="Usuario">
                      {r.usuario}
                      {r.documento && <div className="novedades-sicau-sub">{r.documento}</div>}
                    </td>
                    <td data-label="Cambio">{r.cambio}</td>
                    <td data-label="Enviado por">{r.enviado_por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={x => { setPerPage(x); setPage(1) }} />
        </>
      )}
    </>
  )
}
