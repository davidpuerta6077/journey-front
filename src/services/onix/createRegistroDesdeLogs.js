import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Junta las acciones elegidas en un solo registro: { actividad_id, mes, anio, log_ids }.
export const createRegistroDesdeLogs = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/registros/desde-logs`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al agregar las acciones', { cause: error })
  }
}
