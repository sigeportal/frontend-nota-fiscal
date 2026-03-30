import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfceService } from '../../api/nfce.js'
import { PlusIcon, MagnifyingGlassIcon } from '../../components/Layout/Icons.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Modal from '../../components/common/Modal.jsx'

function formatDateTime(value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date)
}

function downloadXML(chave) {
    nfceService.obterXML(chave)
        .then(res => {
            const blob = new Blob([res.data], { type: 'application/xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `nfce-${chave}.xml`; a.click()
            URL.revokeObjectURL(url)
        })
        .catch(() => toast.error('Erro ao baixar XML'))
}

function downloadDANFE(chave) {
    nfceService.obterDANFE(chave)
        .then(res => {
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url; a.download = `danfce-${chave}.pdf`; a.click()
            URL.revokeObjectURL(url)
        })
        .catch(() => toast.error('Erro ao baixar DANFCe'))
}

function ResultCard({ result, onClose }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Chave</p>
                    <p className="font-mono text-xs break-all font-medium">{result.chave}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Protocolo</p>
                    <p className="font-mono text-xs font-medium">{result.protocolo}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">cStat</p>
                    <p className="font-semibold">{result.cstat}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Motivo</p>
                    <p className="font-medium">{result.motivo}</p>
                </div>
            </div>
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => downloadXML(result.chave)} className="btn-secondary text-xs">⬇ XML</button>
                <button onClick={() => downloadDANFE(result.chave)} className="btn-secondary text-xs">⬇ DANFCe PDF</button>
                <Link to={`/nfce/${result.chave}/cancelar`} state={{ nota: result }} className="btn-danger text-xs">Cancelar NFC-e</Link>
                <button onClick={onClose} className="btn-secondary text-xs ml-auto">Fechar</button>
            </div>
        </div>
    )
}

export default function NFCePage() {
    const [consultaModal, setConsultaModal] = useState(false)
    const [loadingConsulta, setLoadingConsulta] = useState(false)
    const [consultaResult, setConsultaResult] = useState(null)
    const [historico, setHistorico] = useState([])
    const [loadingHistorico, setLoadingHistorico] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm()

    async function carregarHistorico() {
        setLoadingHistorico(true)
        try {
            const res = await nfceService.listar({ limit: 100 })
            setHistorico(res.data?.data || [])
        } catch {
            toast.error('Erro ao carregar NFC-e emitidas')
        } finally {
            setLoadingHistorico(false)
        }
    }

    useEffect(() => {
        carregarHistorico()
    }, [])

    async function onConsultar(data) {
        const chave = data.chave.trim()
        if (chave.replace(/\D/g, '').length !== 44) {
            toast.error('Chave deve ter 44 dígitos')
            return
        }
        setLoadingConsulta(true)
        try {
            const res = await nfceService.consultar(chave)
            setConsultaResult(res.data.data)
            setConsultaModal(true)
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao consultar NFC-e'
            toast.error(msg)
        } finally {
            setLoadingConsulta(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">NFC-e — Nota Fiscal ao Consumidor</h2>
                    <p className="text-gray-500 text-sm">Modelo 65 | Emissão, consulta e cancelamento</p>
                </div>
                <Link to="/nfce/nova" className="btn-primary">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nova NFC-e
                </Link>
            </div>

            {/* Consulta por chave */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Consultar NFC-e por Chave</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit(onConsultar)} className="flex gap-3">
                        <div className="flex-1">
                            <input
                                className="form-input font-mono"
                                placeholder="Chave de acesso (44 dígitos)"
                                maxLength={44}
                                {...register('chave', { required: 'Informe a chave' })}
                            />
                            {errors.chave && <p className="form-error">{errors.chave.message}</p>}
                        </div>
                        <button type="submit" disabled={loadingConsulta} className="btn-primary flex-shrink-0">
                            {loadingConsulta
                                ? <Spinner size="sm" className="text-white" />
                                : <MagnifyingGlassIcon className="w-4 h-4" />}
                            <span className="ml-2">Consultar</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Emitir NFC-e', desc: 'Gerar nota para venda ao consumidor', to: '/nfce/nova', color: 'border-indigo-500', badge: 'POST /v1/nfce' },
                    { label: 'Consultar', desc: 'Verificar status na SEFAZ pela chave', color: 'border-green-500', badge: 'GET /v1/nfce/:chave' },
                    { label: 'Cancelar', desc: 'Cancelar NFC-e autorizada', color: 'border-red-500', badge: 'POST /v1/nfce/:chave/cancelar' },
                ].map(({ label, desc, color, badge }) => (
                    <div key={label} className={`card border-l-4 ${color}`}>
                        <div className="card-body p-4">
                            <p className="font-semibold text-gray-900 text-sm">{label}</p>
                            <p className="text-gray-500 text-xs mt-1">{desc}</p>
                            <span className="inline-block mt-2 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{badge}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">NFC-e emitidas (servidor)</h3>
                    <button
                        type="button"
                        onClick={carregarHistorico}
                        className="btn-secondary text-xs"
                    >
                        Atualizar lista
                    </button>
                </div>
                <div className="card-body">
                    {loadingHistorico ? (
                        <div className="py-3"><Spinner size="sm" /></div>
                    ) : null}
                    {historico.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma NFC-e emitida foi encontrada para este usuário.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                                        <th className="py-2 pr-3">Chave</th>
                                        <th className="py-2 pr-3">Protocolo</th>
                                        <th className="py-2 pr-3">Emitida em</th>
                                        <th className="py-2 pr-3">Situação</th>
                                        <th className="py-2 pr-3">Acoes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historico.map((item) => (
                                        <tr key={item.chave} className="border-b border-gray-100 align-top">
                                            <td className="py-2 pr-3 font-mono text-xs break-all max-w-[240px]">{item.chave}</td>
                                            <td className="py-2 pr-3 font-mono text-xs">{item.protocolo || '-'}</td>
                                            <td className="py-2 pr-3 text-xs">{formatDateTime(item.emitida_em)}</td>
                                            <td className="py-2 pr-3 text-xs">{item.situacao || '-'}</td>
                                            <td className="py-2 pr-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button onClick={() => downloadXML(item.chave)} className="btn-secondary text-xs">XML</button>
                                                    <button onClick={() => downloadDANFE(item.chave)} className="btn-secondary text-xs">DANFCe PDF</button>
                                                    <Link to={`/nfce/${item.chave}/cancelar`} state={{ nota: item }} className="btn-danger text-xs">Cancelar</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={consultaModal} onClose={() => setConsultaModal(false)} title="Resultado da Consulta NFC-e">
                {consultaResult && (
                    <ResultCard result={consultaResult} onClose={() => setConsultaModal(false)} />
                )}
            </Modal>
        </div>
    )
}
