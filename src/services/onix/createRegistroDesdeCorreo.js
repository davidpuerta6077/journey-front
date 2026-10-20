import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Agrega correos enviados como subactividad: { actividad_id, mes, anio, correo_ids, titulo | registro_id }.
export const createRegistroDesdeCorreo = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/registros/desde-correo`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al agregar los correos', { cause: error })
  }
}
