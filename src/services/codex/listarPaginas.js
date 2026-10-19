import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const listarPaginas = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/codex/pages`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar tus páginas', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
