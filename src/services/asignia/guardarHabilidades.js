import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: guarda sus habilidades del catálogo con su nivel de dominio (1 a 10).
export const guardarHabilidades = async ({ documento, correo }, habilidades) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/habilidades`, { documento, correo, habilidades }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron guardar tus habilidades', { cause: error })
  }
}
