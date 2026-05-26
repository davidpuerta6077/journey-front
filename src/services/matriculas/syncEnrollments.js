import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const syncEnrollments = async (items) => {
  const res = await axios.post(`${BASE}/enrollments/sync`, { items })
  return res.data
}