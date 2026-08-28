import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchIndicadorMatriculas = async () => {
  try {
    const res = await axios.post(`${BASE}/enrollments/sync/preview`)
    const items = res.data?.body || []
    return items.length
  } catch (e) {
    console.error('Error fetching indicador matriculas:', e.message)
    return 0
  }
}