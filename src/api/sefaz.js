import api from './axios'

export const sefazService = {
    status: (uf, modelo) => api.get('/v1/sefaz/status', { params: { uf, modelo } }),
    inutilizar: (data) => api.post('/v1/sefaz/inutilizar', data),
}
