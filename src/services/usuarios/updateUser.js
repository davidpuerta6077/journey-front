import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const updateUser = async (id, form) => {
  const res = await axios.put(`${BASE}/journey/usuarios/${id}`, form)
  return res.data
}