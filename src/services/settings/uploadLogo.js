import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const uploadLogo = async (file) => {
  try {
    const token = awsAuth.getToken()
    const formData = new FormData()
    formData.append('logo', file)
    const res = await axios.post(`${BASE}/admin/settings/logo`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al subir el logo', { cause: error })
  }
}
