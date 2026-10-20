import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Agrega tareas de Atom como subactividad: { actividad_id, mes, anio, tarea_ids, titulo | registro_id }.
export const createRegistroDesdeAtom = async (data) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/onix/registros/desde-atom`, data, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al agregar las tareas', { cause: error })
  }
}
