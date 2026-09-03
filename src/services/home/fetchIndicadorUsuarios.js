import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchIndicadorUsuarios = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/users/sync/preview`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.length
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener indicador de usuarios', { cause: error })
  }
}