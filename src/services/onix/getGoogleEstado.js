import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Estado de mi conexión con Google Calendar: { configurado, conectado, email }.
export const getGoogleEstado = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/google`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al consultar la conexión con Google', { cause: error })
  }
}
