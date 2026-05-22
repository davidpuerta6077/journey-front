const API_BASE = import.meta.env.VITE_URL_BASE || 'http://localhost:3001'

export async function uploadExcel(file) {
    const formData = new FormData()
    formData.append('excel', file)
    const res = await fetch(`${API_BASE}/users/upload-excel`, {
        method: 'POST',
        body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.body || 'Error al subir el archivo')
    return data.body.filePath
}