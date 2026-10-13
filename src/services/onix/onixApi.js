import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = `${config.api_domain.url_base}/onix`

// Todas las llamadas del módulo Informes (Onix-IA). Devuelve `body` de la
// respuesta estándar de la API, o la respuesta completa si es un archivo.
async function call(method, url, { data, params, responseType } = {}) {
  try {
    const res = await axios({
      method,
      url: `${BASE}${url}`,
      data,
      params,
      responseType,
      headers: { Authorization: `Bearer ${awsAuth.getToken()}` },
    })
    return responseType === 'blob' ? res : res.data?.body
  } catch (error) {
    console.error(error)
    let msg = error.response?.data?.body || error.response?.data?.message
    if (error.response?.data instanceof Blob) {
      try {
        const json = JSON.parse(await error.response.data.text())
        msg = json.body || json.message
      } catch {
        // la respuesta de error no era JSON
      }
    }
    throw new Error(msg || 'No se pudo comunicar con el servidor', { cause: error })
  }
}

function guardarArchivo(res, porDefecto) {
  const disposition = res.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = match ? match[1] : porDefecto
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const getPerfil = () => call('get', '/perfil')
export const savePerfil = (data) => call('put', '/perfil', { data })

export const getAreas = () => call('get', '/areas')
export const createArea = (data) => call('post', '/areas', { data })
export const updateArea = (id, data) => call('put', `/areas/${id}`, { data })
export const deleteArea = (id) => call('delete', `/areas/${id}`)

export const getActividades = (userId) => call('get', '/actividades', { params: userId ? { user_id: userId } : undefined })
export const createActividad = (data) => call('post', '/actividades', { data })
export const updateActividad = (id, data) => call('put', `/actividades/${id}`, { data })
export const deleteActividad = (id) => call('delete', `/actividades/${id}`)

export const getRegistros = (params) => call('get', '/registros', { params })
export const createRegistro = (data) => call('post', '/registros', { data })
export const updateRegistro = (id, data) => call('put', `/registros/${id}`, { data })
export const deleteRegistro = (id) => call('delete', `/registros/${id}`)

export const addEvidencia = ({ archivo, ...campos }) => {
  if (!archivo) return call('post', '/evidencias', { data: campos })
  const form = new FormData()
  Object.entries(campos).forEach(([k, v]) => v != null && form.append(k, v))
  form.append('archivo', archivo)
  return call('post', '/evidencias', { data: form })
}
export const deleteEvidencia = (id) => call('delete', `/evidencias/${id}`)
export const getEvidenciaImagenUrl = async (id) => {
  const res = await call('get', `/evidencias/${id}/archivo`, { responseType: 'blob' })
  return URL.createObjectURL(res.data)
}

export const getInformes = (params) => call('get', '/informes', { params })
export const generarInforme = (data) => call('post', '/informes/generar', { data })
export const updateInforme = (id, data) => call('put', `/informes/${id}`, { data })
export const descargarInformeWord = async (id) => {
  guardarArchivo(await call('get', `/informes/${id}/word`, { responseType: 'blob' }), `informe_${id}.docx`)
}
export const descargarEvidenciasWord = async (actividadId, params) => {
  guardarArchivo(await call('get', `/actividades/${actividadId}/evidencias-word`, { params, responseType: 'blob' }), `evidencias_${actividadId}.docx`)
}

export const getUsuariosArea = (params) => call('get', '/area/usuarios', { params })
