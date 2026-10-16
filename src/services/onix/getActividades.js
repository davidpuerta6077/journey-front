import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Sin userId: las actividades propias. Con userId: las de otro usuario (área/admin).
export const getActividades = async (userId) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/actividades`, {
      headers: { Authorization: `Bearer ${token}` },
      params: userId ? { user_id: userId } : undefined
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar las actividades', { cause: error })
  }
}
