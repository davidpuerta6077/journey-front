import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const fetchTiposReporte = async () => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/reports/tipos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body || []
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al obtener los tipos de reporte', { cause: error })
  }
}
