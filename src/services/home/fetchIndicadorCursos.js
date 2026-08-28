import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchIndicadorCursos = async () => {
  try {
    const res = await axios.post(`${BASE}/courses/sync/preview`)
    const items = res.data?.body || []
    return items.length
  } catch (e) {
    console.error('Error fetching indicador cursos:', e.message)
    return 0
  }
}