import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const searchUsers = async (q) => {
  try {
    const res = await axios.get(`${BASE}/users/search`, { params: { q } })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al buscar estudiantes', { cause: error })
  }
}
