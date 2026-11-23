import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Requerimientos y años mínimos de experiencia por código de curso.
export const listarPerfilesCurso = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/perfiles-curso`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar los perfiles de curso', { cause: error })
  }
}
