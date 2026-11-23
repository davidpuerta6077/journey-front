import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Borrar un nivel académico (los profesores con ese nivel quedan sin nivel).
export const borrarNivel = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.delete(`${BASE}/asignia/niveles/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo borrar el nivel académico', { cause: error })
  }
}
