import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Users, BookOpen, GraduationCap } from 'lucide-react'
import { searchUsers } from '../../../services/usuarios/searchUsers'
import { fetchCourses } from '../../../services/cursos/fetchCourses'
import { fetchEnrollmentsList } from '../../../services/matriculas/fetchEnrollmentsList'
import { getCached, setCached } from '../../../services/swrCache'
import "../../../styles/main/Sync/SyncUsuariosP.css"
import "../../../styles/main/Busqueda/Busqueda.css"

// Mismas keys que Módulo Cursos / Módulo Matrículas: si ya se visitó esa
// pantalla en esta sesión, la búsqueda arranca con esos datos sin esperar.
const COURSES_CACHE_KEY = 'courses-list'
const ENROLLMENTS_CACHE_KEY = 'enrollments-list'
const MIN_CHARS = 2
const MAX_RESULTADOS = 8

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function Seccion({ icon: Icon, titulo, total, children }) {
  return (
    <div className="busqueda-section">
      <div className="busqueda-section-title">
        <Icon size={16} />
        {titulo} <span>({total})</span>
      </div>
      {children}
    </div>
  )
}

function Item({ icon: Icon, titulo, sub, onClick }) {
  return (
    <button type="button" className="busqueda-item" onClick={onClick}>
      <span className="busqueda-item-icon"><Icon size={14} /></span>
      <span className="busqueda-item-body">
        <span className="busqueda-item-title">{titulo}</span>
        <span className="busqueda-item-sub">{sub}</span>
      </span>
    </button>
  )
}

export default function Busqueda() {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState(() => location.state?.q || '')
  const debouncedQ = useDebounced(q)
  const term = debouncedQ.trim().toLowerCase()
  const buscando = term.length >= MIN_CHARS

  const [courses, setCourses] = useState(() => getCached(COURSES_CACHE_KEY) || [])
  const [enrollments, setEnrollments] = useState(() => getCached(ENROLLMENTS_CACHE_KEY) || [])
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Cursos y matrículas: se cargan completos una sola vez (como en sus
  // propios módulos) y se filtran en el cliente al escribir.
  useEffect(() => {
    fetchCourses().then(data => { setCached(COURSES_CACHE_KEY, data); setCourses(data) }).catch(() => {})
    fetchEnrollmentsList().then(data => { setCached(ENROLLMENTS_CACHE_KEY, data); setEnrollments(data) }).catch(() => {})
  }, [])

  // Usuarios puede ser una lista enorme: se busca en el servidor (GET
  // /users/search?q=), no se carga todo de antemano.
  useEffect(() => {
    if (!buscando) { setUsers([]); return }
    let cancelado = false
    setLoadingUsers(true)
    searchUsers(term)
      .then(data => { if (!cancelado) setUsers(data) })
      .catch(() => { if (!cancelado) setUsers([]) })
      .finally(() => { if (!cancelado) setLoadingUsers(false) })
    return () => { cancelado = true }
  }, [term, buscando])

  const coursesResult = useMemo(() => {
    if (!buscando) return []
    return courses.filter(c =>
      `${c.fullname || ''} ${c.shortname || ''} ${c.idnumber || ''} ${c.nombre_profesor || ''}`.toLowerCase().includes(term)
    )
  }, [courses, term, buscando])

  const enrollmentsResult = useMemo(() => {
    if (!buscando) return []
    return enrollments.filter(e =>
      `${e.nombre_estudiante || ''} ${e.email || ''} ${e.nombre_asignatura || ''} ${e.codigo_journey || ''}`.toLowerCase().includes(term)
    )
  }, [enrollments, term, buscando])

  const irAUsuarios = (u) => navigate('/modulos/usuarios', { state: { q: u.email || u.documento || '' } })
  const irACursos = (c) => navigate('/modulos/cursos', { state: { q: c.shortname || c.idnumber || '' } })
  const irAMatriculas = (e) => navigate('/modulos/matriculas', { state: { q: e.nombre_estudiante || e.codigo_journey || '' } })

  return (
    <div className="sync-page">
      <div className="sync-page-header">
        <h2>Búsqueda</h2>
      </div>

      <div className="filters-bar">
        <div className="filter-input-wrapper">
          <Search size={15} className="filter-icon" />
          <input
            className="filter-input"
            autoFocus
            placeholder="Buscar usuarios, cursos o matrículas..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      {!buscando && (
        <p className="busqueda-hint">Escribe al menos {MIN_CHARS} letras para buscar en Usuarios, Cursos y Matrículas.</p>
      )}

      {buscando && (
        <div className="busqueda-grid">
          <Seccion icon={Users} titulo="Usuarios" total={loadingUsers ? '...' : users.length}>
            {!loadingUsers && users.length === 0 && <p className="busqueda-empty">Sin resultados.</p>}
            <div className="busqueda-list">
              {users.map(u => (
                <Item
                  key={u.id}
                  icon={Users}
                  titulo={`${u.firstname || ''} ${u.lastname || ''}`.trim() || u.email}
                  sub={u.email || u.documento || ''}
                  onClick={() => irAUsuarios(u)}
                />
              ))}
            </div>
          </Seccion>

          <Seccion icon={BookOpen} titulo="Cursos" total={coursesResult.length}>
            {coursesResult.length === 0 && <p className="busqueda-empty">Sin resultados.</p>}
            <div className="busqueda-list">
              {coursesResult.slice(0, MAX_RESULTADOS).map(c => (
                <Item
                  key={c.id}
                  icon={BookOpen}
                  titulo={c.fullname || c.shortname}
                  sub={`${c.idnumber || c.shortname || ''}${c.periodo ? ' · ' + c.periodo : ''}`}
                  onClick={() => irACursos(c)}
                />
              ))}
            </div>
            {coursesResult.length > MAX_RESULTADOS && (
              <p className="busqueda-empty">+{coursesResult.length - MAX_RESULTADOS} más en Módulo Cursos.</p>
            )}
          </Seccion>

          <Seccion icon={GraduationCap} titulo="Matrículas" total={enrollmentsResult.length}>
            {enrollmentsResult.length === 0 && <p className="busqueda-empty">Sin resultados.</p>}
            <div className="busqueda-list">
              {enrollmentsResult.slice(0, MAX_RESULTADOS).map(e => (
                <Item
                  key={e.id}
                  icon={GraduationCap}
                  titulo={e.nombre_estudiante || e.email}
                  sub={`${e.nombre_asignatura || ''}${e.estado ? ' · ' + e.estado : ''}`}
                  onClick={() => irAMatriculas(e)}
                />
              ))}
            </div>
            {enrollmentsResult.length > MAX_RESULTADOS && (
              <p className="busqueda-empty">+{enrollmentsResult.length - MAX_RESULTADOS} más en Módulo Matrículas.</p>
            )}
          </Seccion>
        </div>
      )}
    </div>
  )
}
