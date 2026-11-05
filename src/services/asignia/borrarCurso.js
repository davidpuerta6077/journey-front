import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const borrarCurso = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/asignia/cursos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo borrar el curso', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
