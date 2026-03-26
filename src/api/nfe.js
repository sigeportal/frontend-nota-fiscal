import api from './axios'

export const nfeService = {
    listar: (params) => api.get('/v1/nfe', { params }),
    emitir: (data) => api.post('/v1/nfe', data),
    consultar: (chave) => api.get(`/v1/nfe/${chave}`),
    cancelar: (chave, protocolo, justificativa) =>
        api.post(`/v1/nfe/${chave}/cancelar`, { protocolo, justificativa }),
    obterXML: (chave) => api.get(`/v1/nfe/${chave}/xml`, { responseType: 'text' }),
    obterDANFE: (chave) => api.get(`/v1/nfe/${chave}/danfe`, { responseType: 'blob' }),
}
