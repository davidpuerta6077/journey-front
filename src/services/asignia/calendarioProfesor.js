import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: su horario semanal (sin sesión, documento + correo).
export const calendarioProfesor = async ({ documento, correo }) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/calendario`, { documento, correo }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo cargar tu horario', { cause: error })
  }
}
