import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

// Pantalla pública: si el profesor tiene el certificado Tutor Virtual y su solicitud de matrícula.
export const tutorVirtualProfesor = async ({ documento, correo, fecha_expedicion_cedula }) => {
  try {
    const res = await axios.post(`${BASE}/asignia-publico/tutor-virtual`, { documento, correo, fecha_expedicion_cedula }, { timeout: 30000 })
    return res.data?.body
  } catch (error) {
    console.error(error)
    throw new Error(error.response?.data?.body || 'No se pudo consultar Tutor Virtual', { cause: error })
  }
}
