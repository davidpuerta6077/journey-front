import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchMyTasks = async (filtros = {}) => {
  try {
    const token = awsAuth.getToken()
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    const res = await axios.get(`${BASE}/atom/tasks`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener las tareas', { cause: error })
  }
}
