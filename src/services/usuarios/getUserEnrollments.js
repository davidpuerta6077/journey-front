import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const getUserEnrollments = async (userId) => {
  try {
    const res = await axios.get(`${BASE}/users/${userId}/enrollments`)
    return res.data.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener matrículas del usuario', { cause: error })
  }
}