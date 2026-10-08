import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Cierre de semestre global: finaliza las matrículas activas del
// periodo_actual guardado en Configuración > Académico.
export const finalizePeriodo = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/admin/settings/finalize-periodo`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al cerrar el periodo', { cause: error })
  }
}
