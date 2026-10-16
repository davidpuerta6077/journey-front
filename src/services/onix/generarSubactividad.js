import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Genera con IA el párrafo y el documento de evidencia de una subactividad.
export const generarSubactividad = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/registros/${id}/generar`, {}, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al generar con IA', { cause: error })
  }
}
