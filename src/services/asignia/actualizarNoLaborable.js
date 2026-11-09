import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const actualizarNoLaborable = async (fecha, datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/asignia/dias-no-laborables/${fecha}`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    const e = new Error(error.response?.data?.body || error.response?.data?.message || 'No se pudo actualizar el día no laborable', { cause: error })
    e.status = error.response?.status
    throw e
  }
}
