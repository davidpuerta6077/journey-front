import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const sincronizarProfesores = async (periodo) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/profesores/sincronizar`, { periodo }, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudieron traer los profesores de la programación', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
