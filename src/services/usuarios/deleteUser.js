import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const deleteUser = async (id) => {
  try {
    const res = await axios.delete(`${BASE}/users/${id}`)
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al eliminar usuario', { cause: error })
  }
}