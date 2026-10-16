import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Mis acciones del mes en Bravo Hub aún no asignadas a una actividad ({ mes, anio }).
export const getLogsDisponibles = async (params) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/logs`, { headers: { Authorization: `Bearer ${token}` }, params })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar tus acciones en Bravo Hub', { cause: error })
  }
}
