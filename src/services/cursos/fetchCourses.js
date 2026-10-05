import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Cursos que ya existen en Moodle: sincronizados, y los que tienen una
// "novedad" pendiente (p.ej. cambió el profesor en SICAU) -siguen existiendo
// en Moodle, solo falta empujarles la metadata nueva-. Los que nunca se han
// creado (pendiente) o fallaron sin llegar a existir (error) viven en Sync
// Cursos, no aquí.
const VISIBLE_STATES = ['sincronizado', 'novedad', 'sincronizando']

export const fetchCourses = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/courses/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.filter(c => VISIBLE_STATES.includes(c.estado_sync))
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener cursos', { cause: error })
  }
}
