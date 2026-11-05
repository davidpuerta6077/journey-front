import axios from 'axios'
import config from '../../config'
import awsAuth from '../AwsAuthService'

const BASE = config.api_domain.url_base

export async function processExcelNovedades(filePath) {
    try {
        const res = await axios.post(`${BASE}/enrollments/process-novedades`, { filePath }, { headers: { Authorization: `Bearer ${awsAuth.getToken()}` } })
        return res.data.body
    } catch (error) {
        console.error(error)
        throw new Error(error.response?.data?.body || 'Error al procesar el archivo', { cause: error })
    }
}
