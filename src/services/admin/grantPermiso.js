import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const grantPermiso = async (role_id, submodule_id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/admin/permisos/grant`, { role_id, submodule_id }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al otorgar permiso', { cause: error })
  }
}
