import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Lista completa (incluye inactivos), para la pantalla de Configuración.
export const fetchMenuLinks = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/menu-links`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener los accesos del menú', { cause: error })
  }
}
