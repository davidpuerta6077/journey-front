import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Crear un nivel académico ({ nombre, min_horas, max_horas }).
export const crearNivel = async (datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/niveles`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo crear el nivel académico', { cause: error })
  }
}
