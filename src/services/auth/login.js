const MOCK_USER = {
    email: 'admin@journey.com',
    password: '1234',
    user: {
        id: 1,
        username: 'admin',
        email: 'admin@journey.com',
        rol: 'admin'
    }
}

export async function loginService(email, password) {
    // Simula delay de red
    await new Promise(r => setTimeout(r, 600))

    if (email === MOCK_USER.email && password === MOCK_USER.password) {
        const token = 'mock-token-journey-2024'
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(MOCK_USER.user))
        return { token, user: MOCK_USER.user }
    }

    throw new Error('Credenciales inválidas.')
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