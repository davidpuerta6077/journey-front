import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Cierre de semestre de un curso puntual: pasa a Finalizado sus matrículas
// activas en Nexo. Moodle las desmatricula sola en el próximo cron de la BD
// externa, igual que con cualquier otro cambio de estado.
export const finalizeCourseEnrollments = async (courseid) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/courses/finalize_enrollments`, { courseid }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al cerrar el semestre del curso', { cause: error })
  }
}
