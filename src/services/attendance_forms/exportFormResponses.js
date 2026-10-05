import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Descarga el .xlsx que genera el backend (valida ahí que el usuario sea el
// creador) y lo guarda con el nombre de archivo que manda el servidor.
export const exportFormResponses = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/forms/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match ? match[1] : `asistencia_${id}.xlsx`

    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    throw new Error('Error al descargar el Excel', { cause: error })
  }
}
