import { useState, useMemo } from 'react'

// Estado de los filtros por columna de una tabla. `getters` = { colKey: row => valor }
// (el texto que se ve en la celda). Devuelve las filas que pasan todos los filtros
// y `colProps(key)` con las props listas para <ColumnFilter>.
// `onFilterChange` se llama al cambiar un filtro (normalmente para volver a la página 1).
export default function useColumnFilters(rows, getters, onFilterChange) {
  const [filters, setFilters] = useState({})   // { colKey: Set<string> }
  const keys = Object.keys(getters)
  const str = (key, row) => {
    const v = getters[key](row)
    return v === null || v === undefined ? '' : String(v)
  }

  const values = useMemo(() => {
    const m = {}
    for (const k of keys) m[k] = [...new Set(rows.map(r => str(k, r)))].sort((a, b) => a.localeCompare(b, 'es'))
    return m
  }, [rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => rows.filter(r =>
    keys.every(k => !filters[k] || filters[k].has(str(k, r)))
  ), [rows, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const setColFilter = (key, set) => { setFilters(f => ({ ...f, [key]: set || undefined })); onFilterChange?.() }
  const clearFilters = () => { setFilters({}); onFilterChange?.() }
  const anyFilter = Object.values(filters).some(Boolean)
  const colProps = (key) => ({
    values: values[key] || [],
    selected: filters[key] ?? null,
    onChange: (set) => setColFilter(key, set),
  })

  return { filtered, colProps, anyFilter, clearFilters }
}
