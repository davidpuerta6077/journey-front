import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const addFormShare = async (formId, userId) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/forms/${formId}/shares`, { user_id: userId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al compartir el formulario', { cause: error })
  }
}
