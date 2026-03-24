import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { configuracaoService } from '../api/configuracao.js'
import Spinner from '../components/common/Spinner.jsx'

const UFs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export default function ConfiguracaoPage() {
    const [loading, setLoading] = useState(false)
    const [loadingGet, setLoadingGet] = useState(true)

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
        defaultValues: {
            uf: 'SP',
            ambiente_producao: 0,
            nfce_id_csc: '',
            nfce_csc: '',
            nfce_serie: '1',
            nfce_numero_inicial: 1,
            nfe_serie: '1',
            nfe_numero_inicial: 1,
            emit_nome: '',
            emit_cnpj: '',
            emit_ie: '',
            emit_endereco: '',
            emit_numero: '',
            emit_bairro: '',
            emit_municipio: '',
            emit_cep: '',
            emit_telefone: '',
            emit_crt: 1,
            emit_cod_municipio: '',
            resp_cnpj: '',
            resp_contato: '',
            resp_email: '',
            resp_fone: '',
            resp_id_csrt: '',
            resp_csrt: '',
        },
    })

    useEffect(() => {
        configuracaoService.buscar()
            .then(res => {
                const d = res.data.data
                if (d) reset(d)
            })
            .catch(() => toast.error('Erro ao carregar configurações'))
            .finally(() => setLoadingGet(false))
    }, [reset])

    async function onSubmit(data) {
        setLoading(true)
        try {
            await configuracaoService.salvar({
                ...data,
                ambiente_producao: Number(data.ambiente_producao),
                nfce_numero_inicial: Number(data.nfce_numero_inicial),
                nfe_numero_inicial: Number(data.nfe_numero_inicial),
                emit_crt: Number(data.emit_crt),
                emit_cnpj: data.emit_cnpj.replace(/\D/g, ''),
            })
            toast.success('Configurações salvas com sucesso!')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    if (loadingGet) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-500 text-sm">Emitente, séries, CSC e Responsável Técnico</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Ambiente */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Ambiente</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">UF de Emissão *</label>
                            <select className="form-input" {...register('uf', { required: true })}>
                                {UFs.map(uf => <option key={uf}>{uf}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Ambiente</label>
                            <select className="form-input" {...register('ambiente_producao')}>
                                <option value={0}>Homologação (teste)</option>
                                <option value={1}>Produção</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Emitente */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Dados do Emitente</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label">Razão Social / Nome *</label>
                            <input className="form-input" {...register('emit_nome')} />
                        </div>
                        <div>
                            <label className="form-label">CNPJ (somente números)</label>
                            <input className="form-input" {...register('emit_cnpj')} />
                        </div>
                        <div>
                            <label className="form-label">Inscrição Estadual</label>
                            <input className="form-input" {...register('emit_ie')} />
                        </div>
                        <div>
                            <label className="form-label">CRT</label>
                            <select className="form-input" {...register('emit_crt')}>
                                <option value={1}>1 — Simples Nacional</option>
                                <option value={2}>2 — Simples Nacional (excesso)</option>
                                <option value={3}>3 — Regime Normal (Lucro Real/Presumido)</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Telefone</label>
                            <input className="form-input" {...register('emit_telefone')} />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Endereço (Logradouro)</label>
                            <input className="form-input" {...register('emit_endereco')} />
                        </div>
                        <div>
                            <label className="form-label">Número</label>
                            <input className="form-input" {...register('emit_numero')} />
                        </div>
                        <div>
                            <label className="form-label">Bairro</label>
                            <input className="form-input" {...register('emit_bairro')} />
                        </div>
                        <div>
                            <label className="form-label">Município</label>
                            <input className="form-input" {...register('emit_municipio')} />
                        </div>
                        <div>
                            <label className="form-label">Cód. IBGE Município</label>
                            <input className="form-input" {...register('emit_cod_municipio')} />
                        </div>
                        <div>
                            <label className="form-label">CEP</label>
                            <input className="form-input" placeholder="00000-000" {...register('emit_cep')} />
                        </div>
                    </div>
                </div>

                {/* NF-e */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">NF-e (Modelo 55)</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Série</label>
                            <input className="form-input" {...register('nfe_serie')} />
                        </div>
                        <div>
                            <label className="form-label">Número Inicial</label>
                            <input type="number" className="form-input" {...register('nfe_numero_inicial', { min: 1 })} />
                        </div>
                    </div>
                </div>

                {/* NFC-e */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">NFC-e (Modelo 65)</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Série</label>
                            <input className="form-input" {...register('nfce_serie')} />
                        </div>
                        <div>
                            <label className="form-label">Número Inicial</label>
                            <input type="number" className="form-input" {...register('nfce_numero_inicial', { min: 1 })} />
                        </div>
                        <div>
                            <label className="form-label">ID CSC</label>
                            <input className="form-input" {...register('nfce_id_csc')} />
                        </div>
                        <div>
                            <label className="form-label">CSC (Código de Segurança)</label>
                            <input className="form-input" {...register('nfce_csc')} />
                        </div>
                    </div>
                </div>

                {/* Responsável Técnico */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Responsável Técnico</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">CNPJ</label>
                            <input className="form-input" {...register('resp_cnpj')} />
                        </div>
                        <div>
                            <label className="form-label">Contato</label>
                            <input className="form-input" {...register('resp_contato')} />
                        </div>
                        <div>
                            <label className="form-label">E-mail</label>
                            <input type="email" className="form-input" {...register('resp_email')} />
                        </div>
                        <div>
                            <label className="form-label">Telefone</label>
                            <input className="form-input" {...register('resp_fone')} />
                        </div>
                        <div>
                            <label className="form-label">ID do CSRT</label>
                            <input className="form-input" {...register('resp_id_csrt')} />
                        </div>
                        <div>
                            <label className="form-label">CSRT</label>
                            <input className="form-input" {...register('resp_csrt')} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? <><Spinner size="sm" className="text-white mr-2" />Salvando...</> : 'Salvar Configurações'}
                    </button>
                </div>
            </form>
        </div>
    )
}
