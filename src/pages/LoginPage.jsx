import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../api/auth.js'
import Spinner from '../components/common/Spinner.jsx'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm()

    async function onSubmit(data) {
        setLoading(true)
        try {
            const res = await authService.login(data.username, data.password)
            login(res.data.data)
            toast.success('Login realizado com sucesso!')
            navigate('/')
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Credenciais inválidas'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Nota Fiscal Online</h1>
                    <p className="text-gray-500 mt-1 text-sm">Faça login para acessar o sistema</p>
                </div>

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="form-label">Usuário</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Seu usuário"
                                    {...register('username', { required: 'Usuário é obrigatório' })}
                                />
                                {errors.username && <p className="form-error">{errors.username.message}</p>}
                            </div>

                            <div>
                                <label className="form-label">Senha</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Sua senha"
                                    {...register('password', { required: 'Senha é obrigatória' })}
                                />
                                {errors.password && <p className="form-error">{errors.password.message}</p>}
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary w-full">
                                {loading ? <Spinner size="sm" className="text-white mr-2" /> : null}
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Não tem conta?{' '}
                            <Link to="/cadastro" className="text-blue-600 hover:text-blue-700 font-medium">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
