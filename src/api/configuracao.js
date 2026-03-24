import api from './axios'

export const configuracaoService = {
    buscar: () => api.get('/v1/configuracoes'),
    salvar: (data) => api.put('/v1/configuracoes', data),
}
