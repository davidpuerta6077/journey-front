import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchUsers = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/users/sync/preview/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.map(u => ({
      ...u,
      nombre: `${u.firstname || ''} ${u.lastname || ''}`.trim(),
      departamento: u.departamento_academico || '-',
    }))
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener usuarios', { cause: error })
  }
}