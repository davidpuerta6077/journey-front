import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const createCourseManual = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/courses/create_manual`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al crear el curso', { cause: error })
  }
}
