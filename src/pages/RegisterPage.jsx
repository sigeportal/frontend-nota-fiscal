import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { usuarioService } from '../api/usuario.js'
import Spinner from '../components/common/Spinner.jsx'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const password = watch('password')

    async function onSubmit(data) {
        setLoading(true)
        try {
            await usuarioService.cadastrar({
                username: data.username,
                email: data.email,
                password: data.password,
                cnpj: data.cnpj.replace(/\D/g, ''),
                razao_social: data.razao_social,
            })
            toast.success('Conta criada! Faça login.')
            navigate('/login')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Erro ao cadastrar'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
                    <p className="text-gray-500 mt-1 text-sm">Nota Fiscal Online</p>
                </div>

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="form-label">Usuário *</label>
                                    <input
                                        className="form-input"
                                        {...register('username', { required: 'Obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                                    />
                                    {errors.username && <p className="form-error">{errors.username.message}</p>}
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="form-label">E-mail *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        {...register('email', { required: 'Obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } })}
                                    />
                                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Senha *</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        {...register('password', { required: 'Obrigatório', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                                    />
                                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Confirmar Senha *</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        {...register('confirmPassword', {
                                            required: 'Obrigatório',
                                            validate: val => val === password || 'Senhas não conferem',
                                        })}
                                    />
                                    {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">CNPJ *</label>
                                <input
                                    className="form-input"
                                    placeholder="00.000.000/0000-00"
                                    {...register('cnpj', {
                                        required: 'Obrigatório',
                                        validate: v => v.replace(/\D/g, '').length === 14 || 'CNPJ deve ter 14 dígitos',
                                    })}
                                />
                                {errors.cnpj && <p className="form-error">{errors.cnpj.message}</p>}
                            </div>

                            <div>
                                <label className="form-label">Razão Social *</label>
                                <input
                                    className="form-input"
                                    {...register('razao_social', { required: 'Obrigatório' })}
                                />
                                {errors.razao_social && <p className="form-error">{errors.razao_social.message}</p>}
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full">
                                {loading ? <Spinner size="sm" className="text-white mr-2" /> : null}
                                {loading ? 'Cadastrando...' : 'Criar Conta'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Já tem conta?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
