import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const uploadMyPhoto = async (file) => {
  try {
    const token = awsAuth.getToken()
    const formData = new FormData()
    formData.append('foto', file)
    const res = await axios.post(`${BASE}/auth/me/foto`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    })
    return res.data?.body || null
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al subir la foto de perfil', { cause: error })
  }
}
