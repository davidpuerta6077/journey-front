import { useState, useEffect, useRef } from 'react'
import { Filter } from 'lucide-react'
import '../styles/main/Sync/SyncUsuariosP.css'

// Filtro de columna estilo Excel: lista los valores presentes en esa columna
// con checkboxes. `selected === null` = todos visibles; si no, solo los del Set.
// `children` reemplaza al `label` cuando el encabezado trae algo más (p. ej. el
// ícono de ordenar); los clics del botón y del menú no llegan al <th>, así no
// disparan el orden de las columnas sortable.
export default function ColumnFilter({ label, values, selected, onChange, children }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const btnRef = useRef(null)

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 262)) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onScroll = (e) => { if (!ref.current || !ref.current.contains(e.target)) setOpen(false) }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const active = selected !== null && selected.size !== values.length
  const shown = values.filter(v => v.toLowerCase().includes(q.toLowerCase()))
  const isChecked = (v) => selected === null || selected.has(v)
  const allShownChecked = shown.length > 0 && shown.every(isChecked)

  const emit = (set) => onChange(set.size === values.length ? null : set)
  const toggle = (v) => {
    const base = selected === null ? new Set(values) : new Set(selected)
    base.has(v) ? base.delete(v) : base.add(v)
    emit(base)
  }
  const toggleAllShown = () => {
    const base = selected === null ? new Set(values) : new Set(selected)
    allShownChecked ? shown.forEach(v => base.delete(v)) : shown.forEach(v => base.add(v))
    emit(base)
  }

  return (
    <div ref={ref} className="col-filter">
      <span>{children ?? label}</span>
      <button
        ref={btnRef}
        type="button"
        title="Filtrar columna"
        className={`col-filter-btn${active ? ' is-active' : ''}`}
        onClick={(e) => { e.stopPropagation(); open ? setOpen(false) : openMenu() }}
      >
        <Filter size={13} fill={active ? '#5b84ff' : 'none'} />
      </button>
      {open && (
        <div className="col-filter-menu" style={{ top: pos.top, left: pos.left }} onClick={e => e.stopPropagation()}>
          <input
            className="filter-input col-filter-search"
            placeholder="Buscar valor..."
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
          <label className="col-filter-all">
            <input type="checkbox" checked={allShownChecked} onChange={toggleAllShown} />
            (Seleccionar todo)
          </label>
          <div className="col-filter-list">
            {shown.length === 0 && <div className="col-filter-empty">Sin coincidencias</div>}
            {shown.map(v => (
              <label key={v} className="col-filter-opt">
                <input type="checkbox" checked={isChecked(v)} onChange={() => toggle(v)} />
                <span>{v || '—'}</span>
              </label>
            ))}
          </div>
          <div className="col-filter-actions">
            <button type="button" className="btn-secondary" onClick={() => { onChange(null); setQ('') }}>Limpiar</button>
            <button type="button" className="btn-primary" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
