import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchRoles = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener roles', { cause: error })
  }
}
