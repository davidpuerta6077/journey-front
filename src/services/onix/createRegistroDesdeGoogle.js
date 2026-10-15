import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Agrega eventos de Google Calendar como subactividad: { actividad_id, mes, anio, evento_ids, titulo | registro_id }.
export const createRegistroDesdeGoogle = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/registros/desde-google`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al agregar los eventos', { cause: error })
  }
}
