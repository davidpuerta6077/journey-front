import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const uploadFavicon = async (file) => {
  try {
    const token = awsAuth.getToken()
    const formData = new FormData()
    formData.append('favicon', file)
    const res = await axios.post(`${BASE}/admin/settings/favicon`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al subir el favicon', { cause: error })
  }
}
