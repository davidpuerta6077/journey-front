import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Mis eventos de Google Calendar del mes aún no asignados ({ mes, anio }).
export const getEventosGoogle = async (params) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/google/eventos`, { headers: { Authorization: `Bearer ${token}` }, params })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar tu calendario de Google', { cause: error })
  }
}
