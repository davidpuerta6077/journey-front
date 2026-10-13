import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Texto o enlace van como JSON; la imagen como multipart en el campo "archivo".
export const addEvidencia = async ({ archivo, ...campos }) => {
  try {
    const token = awsAuth.getToken()
    let data = campos
    if (archivo) {
      data = new FormData()
      Object.entries(campos).forEach(([k, v]) => v != null && data.append(k, v))
      data.append('archivo', archivo)
    }
    const res = await axios.post(`${BASE}/onix/evidencias`, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al agregar la evidencia', { cause: error })
  }
}
