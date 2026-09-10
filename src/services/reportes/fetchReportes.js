import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchReportes = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    const body = error.response?.data?.body
    throw new Error(typeof body === 'string' ? body : 'Error al obtener los reportes', { cause: error })
  }
}
