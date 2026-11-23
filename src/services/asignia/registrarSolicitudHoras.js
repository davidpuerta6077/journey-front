import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Registra que se generó la carta de carga mínima ({ periodo, documento, nombre, horas, min_horas }).
export const registrarSolicitudHoras = async (datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/solicitudes-horas`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'La carta se descargó, pero no se pudo registrar', { cause: error })
  }
}
