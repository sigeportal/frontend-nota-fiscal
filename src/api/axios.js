import axios from 'axios'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://servidor-nota-fiscal-434040955537.southamerica-east1.run.app'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('nf_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Redirect to login on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('nf_token')
            localStorage.removeItem('nf_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
