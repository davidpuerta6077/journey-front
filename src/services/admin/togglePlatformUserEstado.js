import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const togglePlatformUserEstado = async (id, estado) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/admin/usuarios/${id}/estado`, { estado }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al cambiar el estado del usuario', { cause: error })
  }
}
