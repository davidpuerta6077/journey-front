import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const duplicarPorCorreoPendiente = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/users/${id}/correo-pendiente/duplicar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al crear el usuario nuevo', { cause: error })
  }
}
