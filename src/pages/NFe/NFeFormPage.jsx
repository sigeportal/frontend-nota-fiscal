import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfeService } from '../../api/nfe.js'
import { configuracaoService } from '../../api/configuracao.js'
import { extractApiError, extractApiErrorInfo } from '../../utils/apiError.js'
import Spinner from '../../components/common/Spinner.jsx'

const defaultItem = {
    codigo: '',
    descricao: '',
    ean: 'SEM GTIN',
    ncm: '',
    cfop: '',
    unidade: 'UN',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    cest: '',
    cst_icms: '102',
    aliq_icms: 0,
    cst_pis: '07',
    aliq_pis: 0,
    cst_cofins: '07',
    aliq_cofins: 0,
    desconto: 0,
}

const UF_CODE = {
    AC: 12, AL: 27, AP: 16, AM: 13, BA: 29, CE: 23, DF: 53, ES: 32, GO: 52,
    MA: 21, MT: 51, MS: 50, MG: 31, PA: 15, PB: 25, PR: 41, PE: 26, PI: 22,
    RJ: 33, RN: 24, RS: 43, RO: 11, RR: 14, SC: 42, SP: 35, SE: 28, TO: 17,
}

export default function NFeFormPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [configuracao, setConfiguracao] = useState(null)
    const [apiError, setApiError] = useState(null)

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            natureza_operacao: 'VENDA DE MERCADORIA',
            serie: 1,
            ambiente: 2,
            emit_crt: 1,
            forma_pagamento: 0,
            valor_pagamento: 0,
            itens: [{ ...defaultItem }],
            dest_cpf_cnpj: '',
            dest_nome: '',
            dest_ie: '',
            dest_email: '',
            dest_logradouro: '',
            dest_numero: '',
            dest_bairro: '',
            dest_municipio: '',
            dest_uf: 'MS',
            dest_cep: '',
            dest_codigo_municipio: '',
            transp_modalidade: 9,
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

    // Auto-calc item total
    function calcTotal(index) {
        const qtd = parseFloat(watch(`itens.${index}.quantidade`)) || 0
        const vunit = parseFloat(watch(`itens.${index}.valor_unitario`)) || 0
        setValue(`itens.${index}.valor_total`, +(qtd * vunit).toFixed(2))
    }

    useEffect(() => {
        configuracaoService.buscar()
            .then((res) => setConfiguracao(res.data?.data || null))
            .catch(() => {
                toast.error('Nao foi possivel carregar as configuracoes do emitente. Revise em Configuracoes.')
            })
    }, [])

    async function onSubmit(data) {
        setLoading(true)
        setApiError(null)
        try {
            const emitCnpj = (configuracao?.emit_cnpj || '').replace(/\D/g, '')
            const emitUF = (configuracao?.uf || '').trim().toUpperCase() || 'MS'
            const emitCodMunicipio = Number(configuracao?.emit_cod_municipio || 0)

            if (!emitCnpj || !configuracao?.emit_nome || !configuracao?.emit_ie) {
                toast.error('Complete os dados do emitente em Configuracoes antes de emitir a NF-e.')
                return
            }

            const docDest = (data.dest_cpf_cnpj || '').replace(/\D/g, '')
            const destinatario = {
                cnpj: docDest.length === 14 ? docDest : '',
                cpf: docDest.length === 11 ? docDest : '',
                nome: data.dest_nome || '',
                ie: data.dest_ie || '',
                email: data.dest_email || '',
                endereco: {
                    logradouro: data.dest_logradouro || '',
                    numero: data.dest_numero || 'SN',
                    bairro: data.dest_bairro || '',
                    municipio: data.dest_municipio || '',
                    uf: (data.dest_uf || '').trim().toUpperCase() || emitUF,
                    cep: (data.dest_cep || '').replace(/\D/g, ''),
                    codigo_municipio: Number(data.dest_codigo_municipio || 0),
                },
            }

            const payload = {
                cnpj_emitente: emitCnpj,
                natureza_operacao: data.natureza_operacao,
                serie: Number(data.serie),
                ambiente: Number(data.ambiente),
                emit_razao_social: configuracao.emit_nome,
                emit_nome_fantasia: configuracao.emit_nome,
                emit_ie: configuracao.emit_ie,
                emit_crt: Number(configuracao.emit_crt || data.emit_crt),
                emit_cod_uf: UF_CODE[emitUF] || 50,
                emit_cod_mun_ibge: emitCodMunicipio,
                emit_endereco: {
                    logradouro: configuracao.emit_endereco || '',
                    numero: configuracao.emit_numero || 'SN',
                    bairro: configuracao.emit_bairro || '',
                    municipio: configuracao.emit_municipio || '',
                    uf: emitUF,
                    cep: (configuracao.emit_cep || '').replace(/\D/g, ''),
                    codigo_municipio: emitCodMunicipio,
                },
                destinatario,
                transp_modalidade: Number(data.transp_modalidade),
                pagamentos: [{
                    forma: Number(data.forma_pagamento),
                    valor: Number(data.valor_pagamento),
                }],
                itens: data.itens.map((item, i) => ({
                    numero: i + 1,
                    codigo: item.codigo,
                    descricao: item.descricao,
                    ean: item.ean || 'SEM GTIN',
                    ncm: item.ncm,
                    cfop: item.cfop,
                    unidade: item.unidade,
                    quantidade: Number(item.quantidade),
                    valor_unitario: Number(item.valor_unitario),
                    valor_total: Number(item.valor_total),
                    cest: item.cest || '',
                    cst_icms: item.cst_icms,
                    aliq_icms: Number(item.aliq_icms || 0),
                    cst_pis: item.cst_pis,
                    aliq_pis: Number(item.aliq_pis || 0),
                    cst_cofins: item.cst_cofins,
                    aliq_cofins: Number(item.aliq_cofins || 0),
                    desconto: Number(item.desconto || 0),
                })),
            }

            const res = await nfeService.emitir(payload)
            const d = res.data.data
            toast.success(`NF-e emitida! Protocolo: ${d.protocolo}`)
            navigate('/nfe')
        } catch (err) {
            const msg = extractApiError(err, 'Erro ao emitir NF-e')
            toast.error(msg)
            setApiError(extractApiErrorInfo(err, 'Erro ao emitir NF-e'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Emitir NF-e</h2>
                <p className="text-gray-500 text-sm">Nota Fiscal Eletrônica — Modelo 55</p>
            </div>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h3 className="text-sm font-semibold text-red-800">Falha ao emitir NF-e</h3>
                    <p className="mt-1 text-sm text-red-700">{apiError.message}</p>
                    {apiError.status && (
                        <p className="mt-2 text-xs text-red-700">Status HTTP: {apiError.status}</p>
                    )}
                    {apiError.raw && (
                        <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-red-800">Ver retorno tecnico da API</summary>
                            <pre className="mt-2 max-h-56 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">{apiError.raw}</pre>
                        </details>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Dados gerais */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Dados Gerais</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label">Natureza da Operação *</label>
                            <input className="form-input" {...register('natureza_operacao', { required: 'Obrigatório' })} />
                            {errors.natureza_operacao && <p className="form-error">{errors.natureza_operacao.message}</p>}
                        </div>
                        <div>
                            <label className="form-label">Série *</label>
                            <input type="number" className="form-input" {...register('serie', { required: true, min: 1 })} />
                        </div>
                        <div>
                            <label className="form-label">Ambiente *</label>
                            <select className="form-input" {...register('ambiente')}>
                                <option value={2}>Homologação (teste)</option>
                                <option value={1}>Produção</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">CRT do Emitente *</label>
                            <select className="form-input" {...register('emit_crt')}>
                                <option value={1}>1 — Simples Nacional</option>
                                <option value={2}>2 — Simples Nacional (excesso)</option>
                                <option value={3}>3 — Regime Normal</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Destinatário */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Destinatário</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">CPF / CNPJ</label>
                            <input className="form-input" placeholder="Apenas números" {...register('dest_cpf_cnpj')} />
                        </div>
                        <div>
                            <label className="form-label">Nome / Razão Social</label>
                            <input className="form-input" {...register('dest_nome')} />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">E-mail</label>
                            <input type="email" className="form-input" {...register('dest_email')} />
                        </div>
                    </div>
                </div>

                {/* Itens */}
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Itens da Nota</h3>
                        <button type="button" onClick={() => append({ ...defaultItem })} className="btn-secondary text-xs">
                            + Adicionar Item
                        </button>
                    </div>
                    <div className="card-body space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                                    {fields.length > 1 && (
                                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 text-xs">
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="form-label">Código *</label>
                                        <input className="form-input" {...register(`itens.${index}.codigo`, { required: true })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="form-label">Descrição *</label>
                                        <input className="form-input" {...register(`itens.${index}.descricao`, { required: true })} />
                                    </div>
                                    <div>
                                        <label className="form-label">NCM *</label>
                                        <input className="form-input" placeholder="00000000" {...register(`itens.${index}.ncm`, { required: true })} />
                                    </div>
                                    <div>
                                        <label className="form-label">CFOP *</label>
                                        <input className="form-input" placeholder="5102" {...register(`itens.${index}.cfop`, { required: true })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Unidade</label>
                                        <input className="form-input" {...register(`itens.${index}.unidade`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Qtd *</label>
                                        <input type="number" step="0.001" className="form-input"
                                            {...register(`itens.${index}.quantidade`, {
                                                required: true,
                                                onChange: () => calcTotal(index),
                                            })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Vl. Unitário *</label>
                                        <input type="number" step="0.01" className="form-input"
                                            {...register(`itens.${index}.valor_unitario`, {
                                                required: true,
                                                onChange: () => calcTotal(index),
                                            })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Vl. Total</label>
                                        <input type="number" step="0.01" className="form-input bg-gray-50" readOnly
                                            {...register(`itens.${index}.valor_total`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST ICMS</label>
                                        <input className="form-input" placeholder="102" {...register(`itens.${index}.cst_icms`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST PIS</label>
                                        <input className="form-input" placeholder="07" {...register(`itens.${index}.cst_pis`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST COFINS</label>
                                        <input className="form-input" placeholder="07" {...register(`itens.${index}.cst_cofins`)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Endereco do destinatario */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Endereco do Destinatario</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Inscricao Estadual</label>
                            <input className="form-input" {...register('dest_ie')} />
                        </div>
                        <div>
                            <label className="form-label">UF</label>
                            <input className="form-input" maxLength={2} {...register('dest_uf')} />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Logradouro</label>
                            <input className="form-input" {...register('dest_logradouro')} />
                        </div>
                        <div>
                            <label className="form-label">Numero</label>
                            <input className="form-input" {...register('dest_numero')} />
                        </div>
                        <div>
                            <label className="form-label">Bairro</label>
                            <input className="form-input" {...register('dest_bairro')} />
                        </div>
                        <div>
                            <label className="form-label">Municipio</label>
                            <input className="form-input" {...register('dest_municipio')} />
                        </div>
                        <div>
                            <label className="form-label">CEP</label>
                            <input className="form-input" {...register('dest_cep')} />
                        </div>
                        <div>
                            <label className="form-label">Codigo Municipio (IBGE)</label>
                            <input className="form-input" {...register('dest_codigo_municipio')} />
                        </div>
                    </div>
                </div>

                {/* Transporte */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Transporte</h3></div>
                    <div className="card-body">
                        <label className="form-label">Modalidade do Frete</label>
                        <select className="form-input" {...register('transp_modalidade')}>
                            <option value={9}>9 — Sem Ocorrência de Transporte</option>
                            <option value={0}>0 — Por conta do emitente</option>
                            <option value={1}>1 — Por conta do destinatário</option>
                            <option value={2}>2 — Por conta de terceiros</option>
                        </select>
                    </div>
                </div>

                {/* Pagamento */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Pagamento</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Forma de Pagamento</label>
                            <select className="form-input" {...register('forma_pagamento')}>
                                <option value={1}>Dinheiro</option>
                                <option value={2}>Cheque</option>
                                <option value={3}>Cartão de Crédito</option>
                                <option value={4}>Cartão de Débito</option>
                                <option value={5}>Crédito Loja</option>
                                <option value={10}>Vale Alimentação</option>
                                <option value={15}>Boleto Bancário</option>
                                <option value={90}>Sem Pagamento</option>
                                <option value={99}>Outros</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Valor do Pagamento (R$) *</label>
                            <input type="number" step="0.01" className="form-input"
                                {...register('valor_pagamento', { required: true, min: 0 })} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => navigate('/nfe')} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? <><Spinner size="sm" className="text-white mr-2" />Emitindo...</> : 'Emitir NF-e'}
                    </button>
                </div>
            </form>
        </div>
    )
}
