import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const cargarProgramacion = async (archivo, periodo) => {
  try {
    const token = awsAuth.getToken()
    const form = new FormData()
    form.append('archivo', archivo)
    if (periodo) form.append('periodo', periodo)
    const res = await axios.post(`${BASE}/asignia/cargar`, form, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo cargar el archivo', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
