import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchIndicadorCursos = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/courses/sync/preview`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.length
  } catch (e) {
    console.error('Error fetching indicador cursos:', e.message)
    return 0
  }
}