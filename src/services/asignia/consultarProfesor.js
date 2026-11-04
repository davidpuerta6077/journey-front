import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública del profesor: sin sesión, se identifica con documento + correo.
export const consultarProfesor = async ({ documento, correo }) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/consultar`, { documento, correo }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo consultar tu programación', { cause: error })
  }
}
