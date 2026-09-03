import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const deleteUser = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al eliminar usuario', { cause: error })
  }
}