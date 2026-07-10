import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const createEnrollment = async (enrollmentData) => {
  try {
    const res = await axios.post(`${BASE}/enrollments/journey`, enrollmentData)
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al crear matrícula', { cause: error })
  }
}
