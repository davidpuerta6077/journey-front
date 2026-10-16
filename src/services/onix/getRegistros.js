import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export const getRegistros = async (params) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.get(`${BASE}/onix/registros`, { headers: { Authorization: `Bearer ${token}` }, params })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al cargar los registros', { cause: error })
  }
}
