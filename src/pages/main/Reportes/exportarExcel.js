import * as XLSX from 'xlsx'

// Exporta el resultado unificado ({ columns, rows }) a un .xlsx usando los
// labels de las columnas como encabezado.
export function exportarExcel(resultado, nombreArchivo = 'reporte') {
  const { columns = [], rows = [] } = resultado || {}
  const encabezados = columns.map((c) => c.label)
  const cuerpo = rows.map((r) => columns.map((c) => r[c.key] ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([encabezados, ...cuerpo])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `${nombreArchivo}-${fecha}.xlsx`)
}
