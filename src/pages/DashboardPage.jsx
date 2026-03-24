import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const cards = [
    {
        title: 'NF-e',
        description: 'Nota Fiscal Eletrônica (modelo 55)',
        to: '/nfe',
        color: 'bg-blue-500',
        icon: '📄',
    },
    {
        title: 'NFC-e',
        description: 'Nota Fiscal ao Consumidor (modelo 65)',
        to: '/nfce',
        color: 'bg-indigo-500',
        icon: '🛒',
    },
    {
        title: 'Certificados',
        description: 'Gerenciar certificados A1 (PFX)',
        to: '/certificados',
        color: 'bg-green-500',
        icon: '🔐',
    },
    {
        title: 'Configurações',
        description: 'Configurar emitente e séries',
        to: '/configuracoes',
        color: 'bg-orange-500',
        icon: '⚙️',
    },
    {
        title: 'SEFAZ',
        description: 'Status e inutilização de numeração',
        to: '/sefaz',
        color: 'bg-purple-500',
        icon: '🔌',
    },
]

export default function DashboardPage() {
    const { user } = useAuth()

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                    Bem-vindo, {user?.razao_social || user?.username}!
                </h2>
                <p className="text-gray-500 mt-1">Selecione uma funcionalidade para começar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map(({ title, description, to, color, icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className="card hover:shadow-lg transition-shadow group"
                    >
                        <div className="card-body flex items-start gap-4 p-6">
                            <div className={`flex-shrink-0 w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                {icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                                <p className="text-gray-500 text-sm mt-0.5">{description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {user?.cnpj && (
                <div className="mt-8 card bg-blue-50 border border-blue-100">
                    <div className="card-body p-4">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">CNPJ:</span> {user.cnpj}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
