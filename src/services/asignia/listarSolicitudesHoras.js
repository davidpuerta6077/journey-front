import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Cartas de autorización de carga mínima registradas en el periodo (generadas / gestionadas).
export const listarSolicitudesHoras = async (periodo) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/asignia/solicitudes-horas`, { params: { periodo }, headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudieron cargar las cartas de carga mínima', { cause: error })
  }
}
