import axios from 'axios'
import { getToken, logoutService } from './auth/login'

// Inyecta el token JWT en cada request automáticamente
axios.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
})

// Redirige al login si el backend responde 401
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            logoutService()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
