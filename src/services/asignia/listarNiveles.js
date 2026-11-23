import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Niveles académicos con su rango de horas.
export const listarNiveles = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/niveles`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar los niveles académicos', { cause: error })
  }
}
