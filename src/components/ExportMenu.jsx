import { useState, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { exportTable } from '../services/exportTable'
import '../styles/main/Sync/SyncUsuariosP.css'

const FORMATS = [
  { key: 'xlsx', label: 'Excel (.xlsx)' },
  { key: 'xls',  label: 'Excel 97-2003 (.xls)' },
  { key: 'pdf',  label: 'PDF' },
  { key: 'html', label: 'HTML' },
]

// Botón "Exportar" de las tablas de Nexo: deja elegir entre las filas filtradas
// (`rows`, lo que pasó la barra de filtros + filtros por columna) o todas
// (`allRows`) y el formato. `columns` = [{ label, get: row => texto }].
export default function ExportMenu({ title, columns, rows, allRows }) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState('filtered')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)
  const btnRef = useRef(null)

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.right - 250, window.innerWidth - 262)) })
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

  const doExport = (format) => {
    exportTable(format, { title, columns, rows: scope === 'all' ? allRows : rows })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ display: 'inline-flex' }}>
      <button ref={btnRef} type="button" className="btn-secondary" onClick={() => open ? setOpen(false) : openMenu()}>
        <Download size={15} /> Exportar
      </button>
      {open && (
        <div className="col-filter-menu" style={{ top: pos.top, left: pos.left }}>
          <label className="col-filter-opt">
            <input type="radio" name="export-scope" checked={scope === 'filtered'} onChange={() => setScope('filtered')} />
            <span>Filtrados ({rows.length})</span>
          </label>
          <label className="col-filter-opt">
            <input type="radio" name="export-scope" checked={scope === 'all'} onChange={() => setScope('all')} />
            <span>Todos, sin filtrar ({allRows.length})</span>
          </label>
          <div className="col-filter-list" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {FORMATS.map(f => (
              <button key={f.key} type="button" className="btn-secondary" onClick={() => doExport(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
