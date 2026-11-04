import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: sin sesión, se identifica con documento + correo.
export const aceptarAsignacion = async ({ documento, correo }, ids) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/aceptar`, { documento, correo, ids }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo aceptar la asignación', { cause: error })
  }
}
