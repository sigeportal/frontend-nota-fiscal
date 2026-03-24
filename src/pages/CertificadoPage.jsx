import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { certificadoService } from '../api/certificado.js'
import Spinner from '../components/common/Spinner.jsx'

function CertInfo({ cert }) {
    const expired = cert.dias_restantes <= 0
    const warning = cert.dias_restantes <= 30

    return (
        <div className="card">
            <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Informações do Certificado</h3>
                {expired
                    ? <span className="badge-danger">Vencido</span>
                    : warning
                        ? <span className="badge-warning">{cert.dias_restantes} dias restantes</span>
                        : <span className="badge-success">Válido — {cert.dias_restantes} dias</span>}
            </div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
                {[
                    { label: 'CNPJ', value: cert.cnpj },
                    { label: 'Assunto', value: cert.assunto },
                    { label: 'Emissor', value: cert.emissor },
                    { label: 'Válido de', value: cert.validade_ini },
                    { label: 'Válido até', value: cert.validade_fim },
                    { label: 'Thumbprint', value: cert.thumbprint, mono: true },
                ].map(({ label, value, mono }) => (
                    <div key={label} className={label === 'Assunto' || label === 'Emissor' || label === 'Thumbprint' ? 'col-span-2' : ''}>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
                        <p className={`font-medium mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function CertificadoPage() {
    const [uploadLoading, setUploadLoading] = useState(false)
    const [consultaLoading, setConsultaLoading] = useState(false)
    const [certInfo, setCertInfo] = useState(null)
    const fileRef = useRef(null)

    const { register: regUpload, handleSubmit: handleUpload, reset: resetUpload, formState: { errors: errUpload } } = useForm()
    const { register: regConsulta, handleSubmit: handleConsulta, formState: { errors: errConsulta } } = useForm()

    async function onUpload(data) {
        const file = fileRef.current?.files[0]
        if (!file) { toast.error('Selecione o arquivo PFX'); return }
        if (!file.name.toLowerCase().endsWith('.pfx')) { toast.error('O arquivo deve ser .pfx'); return }

        setUploadLoading(true)
        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const base64 = e.target.result.split(',')[1]
                try {
                    const res = await certificadoService.upload(
                        data.cnpj.replace(/\D/g, ''),
                        base64,
                        data.senha
                    )
                    setCertInfo(res.data.data)
                    toast.success('Certificado enviado com sucesso!')
                    resetUpload()
                    if (fileRef.current) fileRef.current.value = ''
                } catch (err) {
                    const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao enviar certificado'
                    toast.error(msg)
                } finally {
                    setUploadLoading(false)
                }
            }
            reader.readAsDataURL(file)
        } catch {
            toast.error('Erro ao ler o arquivo')
            setUploadLoading(false)
        }
    }

    async function onConsultar(data) {
        const cnpj = data.cnpj_consulta.replace(/\D/g, '')
        if (cnpj.length !== 14) { toast.error('CNPJ deve ter 14 dígitos'); return }
        setConsultaLoading(true)
        try {
            const res = await certificadoService.status(cnpj)
            setCertInfo(res.data.data)
        } catch (err) {
            const msg = err.response?.data?.message || 'Certificado não encontrado'
            toast.error(msg)
        } finally {
            setConsultaLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Certificados Digitais A1</h2>
                <p className="text-gray-500 text-sm">Upload e consulta de certificados PFX</p>
            </div>

            {/* Upload */}
            <div className="card">
                <div className="card-header"><h3 className="font-semibold text-gray-900">Upload de Certificado A1 (PFX)</h3></div>
                <div className="card-body">
                    <form onSubmit={handleUpload(onUpload)} className="space-y-4">
                        <div>
                            <label className="form-label">CNPJ *</label>
                            <input
                                className="form-input"
                                placeholder="00.000.000/0000-00"
                                {...regUpload('cnpj', {
                                    required: 'CNPJ obrigatório',
                                    validate: v => v.replace(/\D/g, '').length === 14 || 'CNPJ inválido',
                                })}
                            />
                            {errUpload.cnpj && <p className="form-error">{errUpload.cnpj.message}</p>}
                        </div>

                        <div>
                            <label className="form-label">Arquivo PFX *</label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pfx"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="form-label">Senha do Certificado *</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Senha do arquivo PFX"
                                {...regUpload('senha', { required: 'Senha obrigatória' })}
                            />
                            {errUpload.senha && <p className="form-error">{errUpload.senha.message}</p>}
                        </div>

                        <button type="submit" disabled={uploadLoading} className="btn-primary">
                            {uploadLoading ? <><Spinner size="sm" className="text-white mr-2" />Enviando...</> : '⬆ Enviar Certificado'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Consulta */}
            <div className="card">
                <div className="card-header"><h3 className="font-semibold text-gray-900">Consultar Certificado por CNPJ</h3></div>
                <div className="card-body">
                    <form onSubmit={handleConsulta(onConsultar)} className="flex gap-3">
                        <div className="flex-1">
                            <input
                                className="form-input"
                                placeholder="CNPJ (apenas números)"
                                {...regConsulta('cnpj_consulta', { required: 'Informe o CNPJ' })}
                            />
                            {errConsulta.cnpj_consulta && <p className="form-error">{errConsulta.cnpj_consulta.message}</p>}
                        </div>
                        <button type="submit" disabled={consultaLoading} className="btn-secondary flex-shrink-0">
                            {consultaLoading ? <Spinner size="sm" /> : null}
                            <span className={consultaLoading ? 'ml-2' : ''}>Consultar</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Result */}
            {certInfo && <CertInfo cert={certInfo} />}
        </div>
    )
}
