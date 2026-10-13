import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const createArea = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/areas`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al crear el área', { cause: error })
  }
}
