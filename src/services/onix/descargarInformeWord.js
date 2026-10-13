import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Descarga el Word del informe (el backend valida el acceso).
export const descargarInformeWord = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/informes/${id}/word`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = match ? match[1] : `informe_${id}.docx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    // Con responseType blob el error también llega como Blob: leer el mensaje del backend.
    let msg = null
    if (error.response?.data instanceof Blob) {
      try {
        msg = JSON.parse(await error.response.data.text()).body
      } catch {
        // la respuesta de error no era JSON
      }
    }
    throw new Error(msg || 'Error al descargar el informe', { cause: error })
  }
}
