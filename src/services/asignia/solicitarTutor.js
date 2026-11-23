import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública: solicitar matrícula al curso Tutor Virtual.
export const solicitarTutor = async ({ documento, correo }) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/solicitar-tutor`, { documento, correo }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo enviar la solicitud', { cause: error })
  }
}
