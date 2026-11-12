import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Calificación SIDEM de un profesor en el periodo: promedio y por curso.
export const calificacionProfesor = async (documento, periodo) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/profesores/${encodeURIComponent(documento)}/calificacion`, {
      params: { periodo }, headers: { Authorization: `Bearer ${token}` },
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo consultar la calificación', { cause: error })
  }
}
