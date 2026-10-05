import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchPermisos = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/permisos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || { roles: [], modules: [], grants: [] }
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener permisos', { cause: error })
  }
}
