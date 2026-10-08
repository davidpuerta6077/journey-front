import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// A diferencia de AdminLogs (/admin/logs, exige admin_logs), esta ruta solo
// exige nexo_home -- cualquiera que vea el Home de Nexo ve su actividad.
export const fetchActividadRecienteNexo = async (limit = 8) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/logs/recent-nexo`, {
      params: { limit },
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener la actividad reciente', { cause: error })
  }
}
