import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchIndicadorCursos = async () => {
  const res = await axios.get(`${BASE}/sync/preview/courses`)
  const items = res.data?.body || []
  return items.length
}