import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const resetPassword = async (id) => {
  try {
    const res = await axios.post(`${BASE}/users/reset-password/${id}`)
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al resetear contraseña', { cause: error })
  }
}