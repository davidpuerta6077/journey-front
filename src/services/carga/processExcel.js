const API_BASE = import.meta.env.VITE_URL_BASE|| 'http://localhost:3001'

export async function processExcel(filePath) {
    const res = await fetch(`${API_BASE}/users/process-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.body || 'Error al procesar el archivo')
    return data.body
}