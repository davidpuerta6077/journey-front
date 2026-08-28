import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const syncUsers = async (items) => {
  try {
    const res = await axios.post(`${BASE}/users/sync`, { items })
    return res.data
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al sincronizar usuarios', { cause: error })
  }
}