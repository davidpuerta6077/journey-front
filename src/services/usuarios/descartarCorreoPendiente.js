import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const descartarCorreoPendiente = async (id) => {
  try {
    const token = awsAuth.getToken()
    await axios.delete(`${BASE}/users/${id}/correo-pendiente`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al descartar la novedad', { cause: error })
  }
}
