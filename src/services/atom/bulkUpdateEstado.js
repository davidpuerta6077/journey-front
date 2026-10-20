import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const bulkUpdateEstado = async (ids, estado) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/atom/tasks/bulk/estado`, { ids, estado }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar las tareas seleccionadas', { cause: error })
  }
}
