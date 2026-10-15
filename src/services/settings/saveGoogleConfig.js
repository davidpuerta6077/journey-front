import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const saveGoogleConfig = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/admin/google`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al guardar la credencial de Google', { cause: error })
  }
}
