import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const searchPlatformUsers = async (q) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/forms/users/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al buscar usuarios', { cause: error })
  }
}
