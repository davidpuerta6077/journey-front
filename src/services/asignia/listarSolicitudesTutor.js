import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Solicitudes de matrícula al curso Tutor Virtual.
export const listarSolicitudesTutor = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/solicitudes-tutor`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar las solicitudes de Tutor Virtual', { cause: error })
  }
}
