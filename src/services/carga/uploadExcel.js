import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export async function uploadExcel(file) {
    try {
        const formData = new FormData()
        formData.append('excel', file)
        const res = await axios.post(`${BASE}/users/upload-excel`, formData)
        return res.data.body.filePath
    } catch (error) {
        console.error(error)
        throw new Error(error.response?.data?.body || 'Error al subir el archivo', { cause: error })
    }
}