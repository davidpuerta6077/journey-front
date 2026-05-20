import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const syncUsers = async (items) => {
  const res = await axios.post(`${BASE}/sync/students`, { items })
  return res.data
}