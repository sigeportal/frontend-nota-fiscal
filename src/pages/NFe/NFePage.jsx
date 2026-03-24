import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfeService } from '../../api/nfe.js'
import { PlusIcon, MagnifyingGlassIcon } from '../../components/Layout/Icons.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Modal from '../../components/common/Modal.jsx'

function ResultCard({ result, onClose }) {
    function downloadXML(chave) {
        nfeService.obterXML(chave)
            .then(res => {
                const blob = new Blob([res.data], { type: 'application/xml' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `nfe-${chave}.xml`; a.click()
                URL.revokeObjectURL(url)
            })
            .catch(() => toast.error('Erro ao baixar XML'))
    }

    function downloadDANFE(chave) {
        nfeService.obterDANFE(chave)
            .then(res => {
                const url = URL.createObjectURL(res.data)
                const a = document.createElement('a')
                a.href = url; a.download = `danfe-${chave}.pdf`; a.click()
                URL.revokeObjectURL(url)
            })
            .catch(() => toast.error('Erro ao baixar DANFE'))
    }

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
                <button onClick={() => downloadDANFE(result.chave)} className="btn-secondary text-xs">⬇ DANFE PDF</button>
                <Link to={`/nfe/${result.chave}/cancelar`} className="btn-danger text-xs">Cancelar NF-e</Link>
                <button onClick={onClose} className="btn-secondary text-xs ml-auto">Fechar</button>
            </div>
        </div>
    )
}

export default function NFePage() {
    const [consultaModal, setConsultaModal] = useState(false)
    const [loadingConsulta, setLoadingConsulta] = useState(false)
    const [consultaResult, setConsultaResult] = useState(null)

    const { register, handleSubmit, formState: { errors } } = useForm()

    async function onConsultar(data) {
        const chave = data.chave.trim()
        if (chave.replace(/\D/g, '').length !== 44) {
            toast.error('Chave deve ter 44 dígitos')
            return
        }
        setLoadingConsulta(true)
        try {
            const res = await nfeService.consultar(chave)
            setConsultaResult(res.data.data)
            setConsultaModal(true)
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao consultar NF-e'
            toast.error(msg)
        } finally {
            setLoadingConsulta(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">NF-e — Nota Fiscal Eletrônica</h2>
                    <p className="text-gray-500 text-sm">Modelo 55 | Emissão, consulta e cancelamento</p>
                </div>
                <Link to="/nfe/nova" className="btn-primary">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nova NF-e
                </Link>
            </div>

            {/* Consulta por chave */}
            <div className="card">
                <div className="card-header">
                    <h3 className="font-semibold text-gray-900">Consultar NF-e por Chave</h3>
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
                    { label: 'Emitir NF-e', desc: 'Gerar e transmitir nova nota fiscal', to: '/nfe/nova', color: 'border-blue-500', badge: 'POST /v1/nfe' },
                    { label: 'Consultar', desc: 'Verificar status na SEFAZ pela chave', color: 'border-green-500', badge: 'GET /v1/nfe/:chave' },
                    { label: 'Cancelar', desc: 'Cancelar NF-e autorizada', color: 'border-red-500', badge: 'POST /v1/nfe/:chave/cancelar' },
                ].map(({ label, desc, to, color, badge }) => (
                    <div key={label} className={`card border-l-4 ${color}`}>
                        <div className="card-body p-4">
                            <p className="font-semibold text-gray-900 text-sm">{label}</p>
                            <p className="text-gray-500 text-xs mt-1">{desc}</p>
                            <span className="inline-block mt-2 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{badge}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Consulta result modal */}
            <Modal open={consultaModal} onClose={() => setConsultaModal(false)} title="Resultado da Consulta NF-e">
                {consultaResult && (
                    <ResultCard result={consultaResult} onClose={() => setConsultaModal(false)} />
                )}
            </Modal>
        </div>
    )
}
