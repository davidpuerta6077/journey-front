import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Catálogo de requerimientos técnicos/profesionales (activos e inactivos).
export const listarRequerimientos = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/requerimientos`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar los requerimientos', { cause: error })
  }
}
