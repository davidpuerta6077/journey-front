import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Mis tareas de Atom trabajadas en el mes y aún no asignadas ({ mes, anio }).
export const getTareasAtom = async (params) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/atom/tareas`, { headers: { Authorization: `Bearer ${token}` }, params })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar tus tareas de Atom', { cause: error })
  }
}
