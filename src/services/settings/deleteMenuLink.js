import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const deleteMenuLink = async (id) => {
  try {
    const token = awsAuth.getToken()
    await axios.delete(`${BASE}/admin/menu-links/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al eliminar el acceso de menú', { cause: error })
  }
}
