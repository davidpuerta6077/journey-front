import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const saveSetting = async (categoria, clave, valor) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/admin/settings`, { categoria, clave, valor }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al guardar la configuración', { cause: error })
  }
}
