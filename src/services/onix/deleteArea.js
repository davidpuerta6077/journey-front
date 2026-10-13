import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const deleteArea = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/onix/areas/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al eliminar el área', { cause: error })
  }
}
