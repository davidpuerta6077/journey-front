import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const deleteUser = async (id) => {
  await axios.delete(`${BASE}/journey/usuarios/${id}`)
}