import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchIndicadorMatriculas = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/enrollments/sync/preview`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.length
  } catch (e) {
    console.error('Error fetching indicador matriculas:', e.message)
    return 0
  }
}