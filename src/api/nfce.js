import api from './axios'

export const nfceService = {
    listar: (params) => api.get('/v1/nfce', { params }),
    emitir: (data) => api.post('/v1/nfce', data),
    consultar: (chave) => api.get(`/v1/nfce/${chave}`),
    cancelar: (chave, protocolo, justificativa) =>
        api.post(`/v1/nfce/${chave}/cancelar`, { protocolo, justificativa }),
    obterXML: (chave) => api.get(`/v1/nfce/${chave}/xml`, { responseType: 'text' }),
    obterDANFE: (chave) => api.get(`/v1/nfce/${chave}/danfe`, { responseType: 'blob' }),
}
