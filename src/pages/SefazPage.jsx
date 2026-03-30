import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { sefazService } from '../api/sefaz.js'
import { configuracaoService } from '../api/configuracao.js'
import { extractApiError } from '../utils/apiError.js'
import Spinner from '../components/common/Spinner.jsx'

const UFs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

function StatusBadge({ operando }) {
    return operando
        ? <span className="badge-success text-base px-3 py-1">🟢 Operando Normalmente</span>
        : <span className="badge-danger text-base px-3 py-1">🔴 Problema no Serviço</span>
}

export default function SefazPage() {
    const [statusResult, setStatusResult] = useState(null)
    const [loadingStatus, setLoadingStatus] = useState(false)
    const [loadingInut, setLoadingInut] = useState(false)
    const [cnpjConfigurado, setCnpjConfigurado] = useState('')

    const { register: regStatus, handleSubmit: handleStatus } = useForm({
        defaultValues: { uf: 'MS', modelo: 55 },
    })

    const { register: regInut, handleSubmit: handleInut, reset: resetInut, setValue: setValueInut, watch, formState: { errors: errInut } } = useForm({
        defaultValues: {
            cnpj: '',
            serie: '1',
            nn_ini: 1,
            nn_fin: 1,
            modelo: 55,
            justificativa: '',
        },
    })

    const justInut = watch('justificativa', '')

    useEffect(() => {
        let ativo = true

        async function carregarConfiguracao() {
            try {
                const res = await configuracaoService.buscar()
                const emitCnpj = (res.data?.data?.emit_cnpj || '').replace(/\D/g, '')

                if (!ativo || !emitCnpj) {
                    return
                }

                setCnpjConfigurado(emitCnpj)
                setValueInut('cnpj', emitCnpj)
            } catch (err) {
                if (ativo) {
                    toast.error(extractApiError(err, 'Erro ao carregar configuracoes para inutilizacao'))
                }
            }
        }

        carregarConfiguracao()

        return () => {
            ativo = false
        }
    }, [setValueInut])

    async function onStatus(data) {
        setLoadingStatus(true)
        try {
            const res = await sefazService.status(data.uf, Number(data.modelo))
            setStatusResult(res.data.data)
            toast.success('Consulta realizada com sucesso!')
        } catch (err) {
            const data2 = err.response?.data
            setStatusResult(data2?.data || null)
            const msg = data2?.message || 'Erro ao consultar SEFAZ'
            toast.error(msg)
        } finally {
            setLoadingStatus(false)
        }
    }

    async function onInutilizar(data) {
        setLoadingInut(true)
        try {
            await sefazService.inutilizar({
                cnpj: data.cnpj.replace(/\D/g, ''),
                justificativa: data.justificativa.trim(),
                serie: String(data.serie).trim(),
                nn_ini: Number(data.nn_ini),
                nn_fin: Number(data.nn_fin),
                modelo: Number(data.modelo),
            })
            toast.success('Inutilização realizada com sucesso!')
            resetInut({
                cnpj: cnpjConfigurado,
                serie: '1',
                nn_ini: 1,
                nn_fin: 1,
                modelo: 55,
                justificativa: '',
            })
        } catch (err) {
            toast.error(extractApiError(err, 'Erro ao inutilizar'))
        } finally {
            setLoadingInut(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold text-gray-900">SEFAZ</h2>
                <p className="text-gray-500 text-sm">Status do serviço e inutilização de numeração</p>
            </div>

            {/* Status SEFAZ */}
            <div className="card">
                <div className="card-header"><h3 className="font-semibold text-gray-900">Consultar Status do Serviço</h3></div>
                <div className="card-body space-y-4">
                    <form onSubmit={handleStatus(onStatus)} className="flex gap-3 flex-wrap">
                        <div>
                            <label className="form-label">UF</label>
                            <select className="form-input" {...regStatus('uf')}>
                                {UFs.map(uf => <option key={uf}>{uf}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Modelo</label>
                            <select className="form-input" {...regStatus('modelo')}>
                                <option value={55}>55 — NF-e</option>
                                <option value={65}>65 — NFC-e</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button type="submit" disabled={loadingStatus} className="btn-primary">
                                {loadingStatus ? <Spinner size="sm" className="text-white mr-2" /> : null}
                                Consultar
                            </button>
                        </div>
                    </form>

                    {statusResult && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">UF: <strong>{statusResult.uf}</strong> | Modelo: <strong>{statusResult.modelo}</strong></p>
                                    <p className="text-sm text-gray-500 mt-1">cStat: <strong>{statusResult.cstat}</strong> — {statusResult.motivo}</p>
                                </div>
                                <StatusBadge operando={statusResult.operando} />
                            </div>
                            {statusResult.descricao && (
                                <p className="text-sm text-gray-700">{statusResult.descricao}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Inutilização */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Inutilizar Numeração</h3>
                    <p className="text-sm text-gray-500 mt-1">Utilize para inutilizar faixas de números não emitidos.</p>
                </div>
                <div className="card-body">
                    <div className="card border-l-4 border-orange-400 mb-4">
                        <div className="card-body p-3">
                            <p className="text-orange-700 text-sm font-medium">⚠️ Ação irreversível. A inutilização será transmitida à SEFAZ.</p>
                        </div>
                    </div>

                    <form onSubmit={handleInut(onInutilizar)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">CNPJ *</label>
                                <input className="form-input" placeholder="Apenas números"
                                    {...regInut('cnpj', {
                                        required: 'CNPJ obrigatório',
                                        validate: v => v.replace(/\D/g, '').length === 14 || 'CNPJ inválido',
                                    })} />
                                {cnpjConfigurado ? <p className="text-xs text-gray-500 mt-1">CNPJ preenchido a partir das configurações do emitente.</p> : null}
                                {errInut.cnpj && <p className="form-error">{errInut.cnpj.message}</p>}
                            </div>
                            <div>
                                <label className="form-label">Modelo *</label>
                                <select className="form-input" {...regInut('modelo')}>
                                    <option value={55}>55 — NF-e</option>
                                    <option value={65}>65 — NFC-e</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Série *</label>
                                <input className="form-input" {...regInut('serie', { required: true })} />
                            </div>
                            <div />
                            <div>
                                <label className="form-label">Número Inicial *</label>
                                <input type="number" className="form-input"
                                    {...regInut('nn_ini', { required: true, min: 1 })} />
                                {errInut.nn_ini && <p className="form-error">Obrigatório e &gt; 0</p>}
                            </div>
                            <div>
                                <label className="form-label">Número Final *</label>
                                <input type="number" className="form-input"
                                    {...regInut('nn_fin', { required: true, min: 1 })} />
                                {errInut.nn_fin && <p className="form-error">Obrigatório e &gt; 0</p>}
                            </div>
                        </div>

                        <div>
                            <label className="form-label">
                                Justificativa * <span className="text-gray-400 font-normal">(mín. 15 caracteres — {justInut.length}/255)</span>
                            </label>
                            <textarea rows={3} className="form-input resize-none"
                                {...regInut('justificativa', {
                                    required: 'Justificativa obrigatória',
                                    minLength: { value: 15, message: 'Mínimo 15 caracteres' },
                                })} />
                            {errInut.justificativa && <p className="form-error">{errInut.justificativa.message}</p>}
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={loadingInut} className="btn-danger">
                                {loadingInut ? <><Spinner size="sm" className="text-white mr-2" />Inutilizando...</> : 'Inutilizar Numeração'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
