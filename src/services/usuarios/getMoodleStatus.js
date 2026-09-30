import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const getMoodleStatus = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/users/${id}/moodle/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    const err = new Error(error.response?.data?.body || error.response?.data?.message || 'Error consultando la cuenta en Moodle', { cause: error })
    err.status = error.response?.status
    throw err
  }
}
