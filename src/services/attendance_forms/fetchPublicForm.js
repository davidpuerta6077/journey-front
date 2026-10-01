import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchPublicForm = async (publicToken) => {
  try {
    const res = await axios.get(`${BASE}/f/${publicToken}`)
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al cargar el formulario', { cause: error })
  }
}
