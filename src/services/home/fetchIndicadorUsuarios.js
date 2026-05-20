import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchIndicadorUsuarios = async () => {
  const res = await axios.get(`${BASE}/sync/preview/students`)
  const items = res.data?.body || []
  return items.length
}