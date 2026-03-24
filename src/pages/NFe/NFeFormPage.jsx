import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { nfeService } from '../../api/nfe.js'
import Spinner from '../../components/common/Spinner.jsx'

const defaultItem = {
    codigo: '',
    descricao: '',
    ncm: '',
    cfop: '',
    unidade: 'UN',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    icms_cst: '00',
    pis_cst: '07',
    cofins_cst: '07',
}

export default function NFeFormPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

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
            dest_email: '',
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

    async function onSubmit(data) {
        setLoading(true)
        try {
            const payload = {
                natureza_operacao: data.natureza_operacao,
                serie: Number(data.serie),
                ambiente: Number(data.ambiente),
                emit_crt: Number(data.emit_crt),
                dest_cpf_cnpj: data.dest_cpf_cnpj.replace(/\D/g, ''),
                dest_nome: data.dest_nome,
                dest_email: data.dest_email,
                transp_modalidade: Number(data.transp_modalidade),
                pagamentos: [{
                    forma: Number(data.forma_pagamento),
                    valor: Number(data.valor_pagamento),
                }],
                itens: data.itens.map((item, i) => ({
                    numero: i + 1,
                    codigo: item.codigo,
                    descricao: item.descricao,
                    ncm: item.ncm,
                    cfop: item.cfop,
                    unidade: item.unidade,
                    quantidade: Number(item.quantidade),
                    valor_unitario: Number(item.valor_unitario),
                    valor_total: Number(item.valor_total),
                    icms_cst: item.icms_cst,
                    pis_cst: item.pis_cst,
                    cofins_cst: item.cofins_cst,
                })),
            }

            const res = await nfeService.emitir(payload)
            const d = res.data.data
            toast.success(`NF-e emitida! Protocolo: ${d.protocolo}`)
            navigate('/nfe')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao emitir NF-e'
            toast.error(msg)
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
                                            {...register(`itens.${index}.quantidade`, { required: true })}
                                            onChange={() => calcTotal(index)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Vl. Unitário *</label>
                                        <input type="number" step="0.01" className="form-input"
                                            {...register(`itens.${index}.valor_unitario`, { required: true })}
                                            onChange={() => calcTotal(index)} />
                                    </div>
                                    <div>
                                        <label className="form-label">Vl. Total</label>
                                        <input type="number" step="0.01" className="form-input bg-gray-50" readOnly
                                            {...register(`itens.${index}.valor_total`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST ICMS</label>
                                        <input className="form-input" placeholder="00" {...register(`itens.${index}.icms_cst`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST PIS</label>
                                        <input className="form-input" placeholder="07" {...register(`itens.${index}.pis_cst`)} />
                                    </div>
                                    <div>
                                        <label className="form-label">CST COFINS</label>
                                        <input className="form-input" placeholder="07" {...register(`itens.${index}.cofins_cst`)} />
                                    </div>
                                </div>
                            </div>
                        ))}
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
