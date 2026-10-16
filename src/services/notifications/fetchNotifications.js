import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchNotifications = async (limit = 30) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/notifications`, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener las notificaciones', { cause: error })
  }
}
