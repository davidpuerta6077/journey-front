import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const updateEnrollment = async (id, form) => {
  try {
    const res = await axios.put(`${BASE}/enrollments/${id}`, form)
    return res.data
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar matrícula', { cause: error })
  }
}
