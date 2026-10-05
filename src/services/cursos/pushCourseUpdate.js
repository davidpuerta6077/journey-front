import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Reutiliza /courses/sync: como el curso ya tiene moodle_id, el backend solo
// empuja la metadata (core_course_update_courses con el fullname actual) en
// vez de duplicar la semilla otra vez. Se usa para resolver una "novedad"
// (p.ej. cambio de profesor) directo desde Módulo Cursos.
export const pushCourseUpdate = async (course) => {
  try {
    const token = awsAuth.getToken()
    await axios.post(`${BASE}/courses/sync`, { items: [course] }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar el curso en Moodle', { cause: error })
  }
}
