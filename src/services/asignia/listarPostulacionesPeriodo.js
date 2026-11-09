import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// { periodo, postulaciones } de todo el periodo (por defecto el más reciente).
export const listarPostulacionesPeriodo = async (periodo) => {
  try {
    const token = awsAuth.getToken()
    const params = new URLSearchParams()
    if (periodo) params.set('periodo', periodo)
    const res = await axios.get(`${BASE}/asignia/postulaciones${params.size ? `?${params}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudieron cargar las postulaciones', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
