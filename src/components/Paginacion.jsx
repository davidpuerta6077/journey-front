import { Fragment } from 'react'
import '../styles/components/paginacion.css'

const FILAS_POR_PAGINA = [10, 25, 50, 100]

// Paginación de las tablas: 10 filas por defecto (menos scroll) y un selector
// para ver más si el usuario quiere. Se oculta del todo si caben en una página
// con el tamaño mínimo.
export default function Paginacion({ page, totalPages, total, perPage, onPage, onPerPage }) {
  if (total <= FILAS_POR_PAGINA[0]) return null
  return (
    <div className="pagination">
      {totalPages > 1 && (
        <>
          <button className="page-btn" disabled={page === 1} onClick={() => onPage(1)}>«</button>
          <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => (
              <Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <span className="page-dots">...</span>}
                <button className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
              </Fragment>
            ))}
          <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
          <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(totalPages)}>»</button>
        </>
      )}
      <span className="page-info">Página {page} de {totalPages} — {total} registros</span>
      <label className="page-size">
        Filas por página
        <select value={perPage} onChange={e => onPerPage(Number(e.target.value))}>
          {FILAS_POR_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </div>
  )
}
