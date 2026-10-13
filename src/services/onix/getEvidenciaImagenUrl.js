import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// La imagen exige token: se pide como blob y se devuelve un object URL
// (quien lo usa debe liberarlo con URL.revokeObjectURL).
export const getEvidenciaImagenUrl = async (id) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/evidencias/${id}/archivo`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })
    return URL.createObjectURL(res.data)
  } catch (error) {
    console.error(error)
    throw new Error('No se pudo cargar la imagen', { cause: error })
  }
}
