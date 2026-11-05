import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export async function processExcelCursos(filePath) {
    try {
        const res = await axios.post(`${BASE}/courses/process-excel`, { filePath }, { headers: { Authorization: `Bearer ${awsAuth.getToken()}` } })
        return res.data.body
    } catch (error) {
        console.error(error)
        throw new Error(error.response?.data?.body || error.response?.data?.message || 'Error al procesar el archivo', { cause: error })
    }
}
