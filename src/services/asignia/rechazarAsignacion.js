import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: sin sesión, se identifica con documento + correo.
export const rechazarAsignacion = async ({ documento, correo }, ids, motivo) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/rechazar`, { documento, correo, ids, motivo }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo rechazar la asignación', { cause: error })
  }
}
