import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const createUser = async (userData) => {
  try {
    const res = await axios.post(`${BASE}/users/journey`, userData)
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al crear usuario', { cause: error })
  }
}