import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchGoogleConfig = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/google`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar la credencial de Google', { cause: error })
  }
}
