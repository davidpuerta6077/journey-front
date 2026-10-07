import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchSettings = async (categoria) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/settings`, {
      params: categoria ? { categoria } : {},
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener la configuración', { cause: error })
  }
}
