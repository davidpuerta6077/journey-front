import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchMyProfile = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || null
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener el perfil', { cause: error })
  }
}
