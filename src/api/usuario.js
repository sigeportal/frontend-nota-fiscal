import api from './axios'

export const usuarioService = {
    cadastrar: (data) => api.post('/v1/usuarios', data),
}
