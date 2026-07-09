import axios from 'axios'
import config from '../../config'

const BASE = config.api_domain.url_base

export async function loginService(email, password) {
    const res = await axios.post(`${BASE}/auth/login`, { email, password })
    const { token, user } = res.data.body
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    return { token, user }
}

export function logoutService() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
}

export function getToken() {
    return localStorage.getItem('token')
}

export function getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

export function isAuthenticated() {
    return !!localStorage.getItem('token')
}
