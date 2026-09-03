import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchEnrollmentsList = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/enrollments/list`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = res.data?.body || []
    return items.map(e => ({
      ...e,
      nombre_estudiante: `${e.firstname || ''} ${e.lastname || ''}`.trim()
    }))
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener matrículas', { cause: error })
  }
}
