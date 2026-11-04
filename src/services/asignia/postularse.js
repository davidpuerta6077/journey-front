import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: sin sesión, se identifica con documento + correo.
export const postularse = async ({ documento, correo }, ids, nombre) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/postular`, { documento, correo, ids, nombre }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo registrar tu postulación', { cause: error })
  }
}
