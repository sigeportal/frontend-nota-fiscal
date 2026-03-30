import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfceService } from '../../api/nfce.js'
import Spinner from '../../components/common/Spinner.jsx'

export default function NFCeCancelarPage() {
    const { chave } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const nota = location.state?.nota
    const [loading, setLoading] = useState(false)
    const [loadingNota, setLoadingNota] = useState(false)

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            protocolo: nota?.protocolo || '',
            justificativa: '',
        },
    })
    const justificativa = watch('justificativa', '')
    const protocolo = watch('protocolo', '')

    useEffect(() => {
        if (nota?.protocolo) {
            setValue('protocolo', nota.protocolo)
            return
        }

        let ativo = true

        async function carregarNota() {
            setLoadingNota(true)
            try {
                const res = await nfceService.consultar(chave)
                const protocoloAtual = res.data?.data?.protocolo || ''

                if (ativo && protocoloAtual) {
                    setValue('protocolo', protocoloAtual)
                }
            } catch {
                if (ativo) {
                    toast.error('Nao foi possivel carregar o protocolo automaticamente')
                }
            } finally {
                if (ativo) {
                    setLoadingNota(false)
                }
            }
        }

        carregarNota()

        return () => {
            ativo = false
        }
    }, [chave, nota?.protocolo, setValue])

    async function onSubmit(data) {
        setLoading(true)
        try {
            await nfceService.cancelar(chave, data.protocolo, data.justificativa)
            toast.success('NFC-e cancelada com sucesso!')
            navigate('/nfce')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao cancelar'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Cancelar NFC-e</h2>
                <p className="text-gray-500 text-sm font-mono break-all">{chave}</p>
            </div>

            <div className="card border-l-4 border-red-500">
                <div className="card-body">
                    <p className="text-red-700 text-sm font-medium">
                        ⚠️ Atenção: O cancelamento é irreversível. A NFC-e será cancelada na SEFAZ.
                    </p>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="font-semibold text-gray-900">Dados do Cancelamento</h3></div>
                <div className="card-body">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="form-label">Protocolo de Autorização *</label>
                            <input
                                className="form-input font-mono"
                                placeholder={loadingNota ? 'Carregando protocolo...' : 'Número do protocolo'}
                                readOnly={Boolean(protocolo)}
                                {...register('protocolo', { required: 'Protocolo obrigatório' })}
                            />
                            {protocolo ? <p className="text-xs text-gray-500 mt-1">Protocolo preenchido automaticamente a partir da nota selecionada.</p> : null}
                            {errors.protocolo && <p className="form-error">{errors.protocolo.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">
                                Justificativa * <span className="text-gray-400 font-normal">(mín. 15 caracteres — {justificativa.length}/255)</span>
                            </label>
                            <textarea
                                rows={4}
                                className="form-input resize-none"
                                placeholder="Descreva o motivo do cancelamento..."
                                {...register('justificativa', {
                                    required: 'Justificativa obrigatória',
                                    minLength: { value: 15, message: 'Mínimo 15 caracteres' },
                                    maxLength: { value: 255, message: 'Máximo 255 caracteres' },
                                })}
                            />
                            {errors.justificativa && <p className="form-error">{errors.justificativa.message}</p>}
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <button type="button" onClick={() => navigate('/nfce')} className="btn-secondary">Voltar</button>
                            <button type="submit" disabled={loading} className="btn-danger">
                                {loading ? <><Spinner size="sm" className="text-white mr-2" />Cancelando...</> : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
