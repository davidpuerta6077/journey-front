import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const actualizarCurso = async (id, datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/asignia/cursos/${id}`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo guardar el curso', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
