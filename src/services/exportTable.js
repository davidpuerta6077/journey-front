import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Exporta una tabla a Excel (.xlsx / .xls), PDF o HTML.
// `columns` = [{ label, get: row => texto }] (el texto que se ve en la celda),
// `rows` = las filas a exportar (filtradas o todas, según quien llame).
export function exportTable(format, { title, columns, rows }) {
  const head = columns.map(c => c.label)
  const body = rows.map(r => columns.map(c => {
    const v = c.get(r)
    return v === null || v === undefined ? '' : String(v)
  }))
  const fecha = new Date().toISOString().slice(0, 10)
  const name = `${title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_')}-${fecha}`

  if (format === 'xlsx' || format === 'xls') {
    const ws = XLSX.utils.aoa_to_sheet([head, ...body])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31).replace(/[\\/?*[\]:]/g, ''))
    XLSX.writeFile(wb, `${name}.${format}`, { bookType: format })
    return
  }

  if (format === 'pdf') {
    const doc = new jsPDF({ orientation: head.length > 5 ? 'landscape' : 'portrait' })
    doc.setFontSize(13)
    doc.text(title, 14, 14)
    doc.setFontSize(9)
    doc.text(`${rows.length} registro${rows.length !== 1 ? 's' : ''} · ${new Date().toLocaleString('es-CO')}`, 14, 20)
    autoTable(doc, {
      head: [head], body, startY: 24,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
    })
    doc.save(`${name}.pdf`)
    return
  }

  if (format === 'html') {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#1e293b}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#1e3a8a;color:#fff}tr:nth-child(even) td{background:#f1f5f9}</style>
</head><body><h2>${esc(title)}</h2><p>${rows.length} registro${rows.length !== 1 ? 's' : ''} · ${new Date().toLocaleString('es-CO')}</p>
<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${body.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.html`
    a.click()
    URL.revokeObjectURL(url)
  }
}
