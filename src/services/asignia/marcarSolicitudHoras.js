import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Marca o desmarca la carta de carga mínima como gestionada.
export const marcarSolicitudHoras = async (id, gestionada) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/asignia/solicitudes-horas/${id}`, { gestionada }, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo actualizar la carta', { cause: error })
  }
}
