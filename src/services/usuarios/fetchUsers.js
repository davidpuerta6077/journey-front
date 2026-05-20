import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export const fetchUsers = async () => {
  const res = await axios.get(`${BASE}/sync/preview/students`)
  const items = res.data?.body || []
  return items.map(u => ({
    ...u,
    nombre: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
    departamento: u.departamento_academico || '-',
    _syncStatus: u._syncStatus || { inDB: false, inMoodle: false }
  }))
}