import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const updateMyUsername = async (username) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/auth/me`, { username }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || null
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar el username', { cause: error })
  }
}
