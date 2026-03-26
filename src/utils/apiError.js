export function extractApiError(error, fallback = 'Ocorreu um erro ao processar sua solicitacao.') {
    const status = error?.response?.status
    const data = error?.response?.data

    const rawError = data?.error
    const normalizedError =
        typeof rawError === 'string'
            ? rawError
            : rawError?.message || rawError?.erro || ''

    const baseMessage =
        data?.message ||
        normalizedError ||
        data?.erro ||
        error?.message ||
        fallback

    const dataDetails = data?.details || data?.detalhes || data?.data?.motivo || data?.data?.erro
    const validationErrors = Array.isArray(data?.errors) ? data.errors.join(' | ') : ''

    let statusHint = ''
    if (status === 400) statusHint = 'Revise os dados enviados.'
    if (status === 401) statusHint = 'Sua sessao expirou. Faca login novamente.'
    if (status === 403) statusHint = 'Voce nao tem permissao para esta acao.'
    if (status === 404) statusHint = 'Recurso nao encontrado.'
    if (status === 422) statusHint = 'Dados rejeitados pela API/SEFAZ.'
    if (status >= 500) statusHint = 'Falha interna do servidor. Tente novamente em instantes.'

    const extra = [statusHint, dataDetails, validationErrors].filter(Boolean).join(' ')
    return extra ? `${baseMessage} ${extra}` : baseMessage
}

export function extractApiErrorInfo(error, fallback = 'Ocorreu um erro ao processar sua solicitacao.') {
    const status = error?.response?.status || null
    const data = error?.response?.data

    const message = extractApiError(error, fallback)

    let raw = ''
    if (typeof data === 'string') {
        raw = data
    } else if (data) {
        try {
            raw = JSON.stringify(data, null, 2)
        } catch {
            raw = String(data)
        }
    }

    return {
        status,
        message,
        raw,
    }
}
