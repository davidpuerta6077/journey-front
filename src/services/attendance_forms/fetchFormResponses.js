import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchFormResponses = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/forms/${id}/responses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || { questions: [], responses: [] }
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener los inscritos', { cause: error })
  }
}
