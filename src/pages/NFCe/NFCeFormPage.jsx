import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfceService } from '../../api/nfce.js'
import { configuracaoService } from '../../api/configuracao.js'
import { extractApiError, extractApiErrorInfo } from '../../utils/apiError.js'
import Spinner from '../../components/common/Spinner.jsx'

const defaultItem = {
    codigo: '',
    descricao: '',
    ean: 'SEM GTIN',
    ncm: '',
    cfop: '5102',
    unidade: 'UN',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    cest: '',
    cst_icms: '500',
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

export default function NFCeFormPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [configuracao, setConfiguracao] = useState(null)
    const [apiError, setApiError] = useState(null)

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            natureza_operacao: 'VENDA A CONSUMIDOR',
            serie: 1,
            ambiente: 2,
            cpf_cliente: '',
            nome_cliente: '',
            forma_pagamento: 1,
            valor_pagamento: 0,
            itens: [{ ...defaultItem }],
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

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
            const emitCodMunicipio = Number(configuracao?.emit_cod_municipio || 0)
            const emitUF = (configuracao?.uf || '').trim().toUpperCase() || 'MS'

            if (!emitCnpj || !configuracao?.emit_nome || !configuracao?.emit_ie) {
                toast.error('Complete os dados do emitente em Configuracoes antes de emitir a NFC-e.')
                return
            }

            if (!/^[A-Z]{2}$/.test(emitUF)) {
                toast.error('UF do emitente invalida. Corrija em Configuracoes.')
                return
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
                cpf_cliente: data.cpf_cliente.replace(/\D/g, ''),
                nome_cliente: data.nome_cliente,
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

            const res = await nfceService.emitir(payload)
            const d = res.data.data
            toast.success(`NFC-e emitida! Protocolo: ${d.protocolo}`)
            navigate('/nfce')
        } catch (err) {
            const msg = extractApiError(err, 'Erro ao emitir NFC-e')
            toast.error(msg)
            setApiError(extractApiErrorInfo(err, 'Erro ao emitir NFC-e'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Emitir NFC-e</h2>
                <p className="text-gray-500 text-sm">Nota Fiscal ao Consumidor — Modelo 65</p>
            </div>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h3 className="text-sm font-semibold text-red-800">Falha ao emitir NFC-e</h3>
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
                            <input className="form-input" {...register('natureza_operacao', { required: true })} />
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
                    </div>
                </div>

                {/* Cliente (opcional) */}
                <div className="card">
                    <div className="card-header"><h3 className="font-semibold text-gray-900">Cliente (opcional)</h3></div>
                    <div className="card-body grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">CPF do Cliente</label>
                            <input className="form-input" placeholder="000.000.000-00" {...register('cpf_cliente')} />
                        </div>
                        <div>
                            <label className="form-label">Nome do Cliente</label>
                            <input className="form-input" {...register('nome_cliente')} />
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
                                        <input className="form-input" {...register(`itens.${index}.ncm`, { required: true })} />
                                    </div>
                                    <div>
                                        <label className="form-label">EAN</label>
                                        <input className="form-input" {...register(`itens.${index}.ean`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CFOP</label>
                                        <input className="form-input" {...register(`itens.${index}.cfop`)} />
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
                                        <input className="form-input" placeholder="500" {...register(`itens.${index}.cst_icms`)} />
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
                            <label className="form-label">Valor (R$) *</label>
                            <input type="number" step="0.01" className="form-input"
                                {...register('valor_pagamento', { required: true, min: 0 })} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => navigate('/nfce')} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? <><Spinner size="sm" className="text-white mr-2" />Emitindo...</> : 'Emitir NFC-e'}
                    </button>
                </div>
            </form>
        </div>
    )
}
