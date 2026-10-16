import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Desconecta mi cuenta de Google (revoca el permiso).
export const desconectarGoogle = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/onix/google`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al desconectar Google', { cause: error })
  }
}
