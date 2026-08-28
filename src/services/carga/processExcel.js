import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export async function processExcel(filePath) {
    try {
        const res = await axios.post(`${BASE}/users/process-excel`, { filePath })
        return res.data.body
    } catch (error) {
        console.error(error)
        throw new Error(error.response?.data?.body || 'Error al procesar el archivo', { cause: error })
    }
}