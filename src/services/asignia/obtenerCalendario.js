import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// { periodo, periodos, semestre, semanas, noLaborables, sesiones, invalidas, cruces, carga, sesionesRelacionadas? }
export const obtenerCalendario = async ({ periodo, documento } = {}) => {
  try {
    const token = awsAuth.getToken()
    const params = new URLSearchParams()
    if (periodo) params.set('periodo', periodo)
    if (documento) params.set('documento', documento)
    const res = await axios.get(`${BASE}/asignia/calendario${params.size ? `?${params}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo cargar el calendario', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
