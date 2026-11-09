import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const generarFestivos = async (anio) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.post(`${BASE}/asignia/dias-no-laborables/generar`, { anio }, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudieron generar los festivos', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
