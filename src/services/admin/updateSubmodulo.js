import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const updateSubmodulo = async (id, data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/admin/submodulos/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar submódulo', { cause: error })
  }
}
