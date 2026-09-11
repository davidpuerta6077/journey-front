import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchMoodleSemillas = async (categoryId) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/admin/moodle_semillas`, {
      headers: { Authorization: `Bearer ${token}` },
      params: categoryId ? { categoryid: categoryId } : {}
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener cursos semilla de Moodle', { cause: error })
  }
}
