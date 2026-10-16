import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchUnreadCount = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body?.count || 0
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener las notificaciones sin leer', { cause: error })
  }
}
