import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchEnrollments = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/enrollments/sync/preview`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.map(e => ({
      ...e,
      nombre: `${e.firstname || ''} ${e.lastname || ''}`.trim()
    }))
  } catch (e) {
    console.error('Error fetching enrollments:', e.message)
    return []
  }
}