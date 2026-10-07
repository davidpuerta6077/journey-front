import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const aplicarCorreoPendiente = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/users/${id}/correo-pendiente/aplicar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar el correo', { cause: error })
  }
}
