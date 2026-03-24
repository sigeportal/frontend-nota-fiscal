import api from './axios'

export const authService = {
    login: (username, password) =>
        api.post('/v1/auth/login', { username, password }),
}
