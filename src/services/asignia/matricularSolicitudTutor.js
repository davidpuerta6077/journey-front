import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Marcar una solicitud de Tutor Virtual como matriculado.
export const matricularSolicitudTutor = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/solicitudes-tutor/${id}/matricular`, {}, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo actualizar la solicitud', { cause: error })
  }
}
