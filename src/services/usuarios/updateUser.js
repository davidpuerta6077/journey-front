import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const updateUser = async (id, form) => {
  try {
   const token = awsAuth.getToken()
   const res = await axios.put(`${BASE}/users/${id}`, form, {
     headers: { Authorization: `Bearer ${token}` }
   })
    return res.data
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'Error al actualizar usuario', { cause: error })
  }
}