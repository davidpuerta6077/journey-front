import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const submitPublicResponse = async (publicToken, answers) => {
  try {
    const res = await axios.post(`${BASE}/f/${publicToken}/responses`, { answers })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al enviar tu registro', { cause: error })
  }
}
