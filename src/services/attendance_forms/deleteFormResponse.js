import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const deleteFormResponse = async (formId, responseId) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/forms/${formId}/responses/${responseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al eliminar el registro', { cause: error })
  }
}
