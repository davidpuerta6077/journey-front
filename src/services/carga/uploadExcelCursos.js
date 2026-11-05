import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export async function uploadExcelCursos(file) {
    try {
        const formData = new FormData()
        formData.append('excel', file)
        const res = await axios.post(`${BASE}/courses/upload-excel`, formData, { headers: { Authorization: `Bearer ${awsAuth.getToken()}` } })
        return res.data.body.filePath
    } catch (error) {
        console.error(error)
        throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al subir el archivo', { cause: error })
    }
}
