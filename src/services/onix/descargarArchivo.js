import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Nombre real del archivo: filename* (UTF-8, con tildes) o filename.
function nombreDe(disposition, porDefecto) {
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8) return decodeURIComponent(utf8[1])
  const simple = disposition.match(/filename="?([^";]+)"?/i)
  return simple ? simple[1] : porDefecto
}

// Descarga un Word o zip del módulo Informes. `ruta` es relativa a /onix.
export const descargarArchivo = async (ruta, params, porDefecto) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix${ruta}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      responseType: 'blob'
    })
    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreDe(res.headers['content-disposition'] || '', porDefecto)
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
    throw new Error(msg || 'Error al descargar el archivo', { cause: error })
  }
}
