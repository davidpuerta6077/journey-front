import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const probarIA = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/admin/ia/probar`, undefined, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo conectar con la IA', { cause: error })
  }
}
