import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchApiStatus = async () => {
  try {
    const res = await axios.get(`${BASE}/health`)
    return res.data?.body?.status === 'ok' ? 'Activa' : 'Error'
  } catch {
    return 'Error'
  }
}