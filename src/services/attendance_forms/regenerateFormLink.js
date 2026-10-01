import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const regenerateFormLink = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/forms/${id}/regenerate-link`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al regenerar el link', { cause: error })
  }
}
