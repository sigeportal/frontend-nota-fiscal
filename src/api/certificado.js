import api from './axios'

export const certificadoService = {
    upload: (cnpj, certificado, senha) =>
        api.post('/v1/certificados/upload', { cnpj, certificado, senha }),
    status: (cnpj) => api.get(`/v1/certificados/${cnpj}`),
}
