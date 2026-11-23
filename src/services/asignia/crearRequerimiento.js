import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Crear un requerimiento en el catálogo.
export const crearRequerimiento = async (nombre) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/requerimientos`, { nombre }, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo crear el requerimiento', { cause: error })
  }
}
