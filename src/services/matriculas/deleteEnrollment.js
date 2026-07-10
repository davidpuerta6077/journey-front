import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const deleteEnrollment = async (id) => {
  try {
    await axios.delete(`${BASE}/enrollments/${id}`)
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al eliminar matrícula', { cause: error })
  }
}
