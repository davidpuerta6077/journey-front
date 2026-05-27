import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchEnrollments = async () => {
  try {
    const res = await axios.post(`${BASE}/enrollments/sync/preview`)
    const items = res.data?.body || []
    return items.map(e => ({
      ...e,
      nombre: `${e.firstname || ''} ${e.lastname || ''}`.trim()
    }))
  } catch (e) {
    console.error('Error fetching enrollments:', e.message)
    return []
  }
}