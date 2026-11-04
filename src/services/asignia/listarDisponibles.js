import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: sin sesión, se identifica con documento + correo.
export const listarDisponibles = async ({ documento, correo }) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/disponibles`, { documento, correo }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar los cursos disponibles', { cause: error })
  }
}
