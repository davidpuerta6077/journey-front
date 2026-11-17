import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Certificación de la inducción docente Ser+ Digital (Moodle) de un profesor: si la tiene y la fecha.
export const induccionProfesor = async (documento, correo) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/profesores/${encodeURIComponent(documento)}/induccion`, {
      params: { correo }, headers: { Authorization: `Bearer ${token}` },
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo consultar la inducción', { cause: error })
  }
}
