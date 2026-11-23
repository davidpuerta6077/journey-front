import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

// Guardar requerimientos y años mínimos de un código de curso ({ req_anios, requerimientos }).
export const guardarPerfilCurso = async (codigo, datos) => {
  try {
    const token = awsAuth.getToken()
    const res = await axios.put(`${BASE}/asignia/perfiles-curso/${encodeURIComponent(codigo)}`, datos, { headers: { Authorization: `Bearer ${token}` } })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo guardar el perfil del curso', { cause: error })
  }
}
