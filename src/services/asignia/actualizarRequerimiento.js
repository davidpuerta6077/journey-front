import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Editar el nombre o activar/desactivar un requerimiento ({ nombre?, activo? }).
export const actualizarRequerimiento = async (id, datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/asignia/requerimientos/${id}`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo guardar el requerimiento', { cause: error })
  }
}
