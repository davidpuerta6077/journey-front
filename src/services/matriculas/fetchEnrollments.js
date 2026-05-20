import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchEnrollments = async () => {
  const res = await axios.get(`${BASE}/enrollments/preview`)
  const items = res.data?.body || []
  return items.map(e => ({
    ...e,
    nombre: `${e.firstname || ''} ${e.lastname || ''}`.trim()
  }))
}