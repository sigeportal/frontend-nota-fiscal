import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    HomeIcon, DocumentTextIcon, ShoppingCartIcon,
    ShieldCheckIcon, CogIcon, ServerIcon, ArrowRightOnRectangleIcon
} from './Icons.jsx'

const navItems = [
    { to: '/', label: 'Dashboard', Icon: HomeIcon },
    { to: '/nfe', label: 'NF-e', Icon: DocumentTextIcon },
    { to: '/nfce', label: 'NFC-e', Icon: ShoppingCartIcon },
    { to: '/certificados', label: 'Certificados', Icon: ShieldCheckIcon },
    { to: '/configuracoes', label: 'Configurações', Icon: CogIcon },
    { to: '/sefaz', label: 'SEFAZ', Icon: ServerIcon },
]

export default function Layout() {
    const { user, logout } = useAuth()
    const { pathname } = useLocation()

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm leading-tight">Nota Fiscal</p>
                        <p className="text-gray-400 text-xs">Online</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map(({ to, label, Icon }) => {
                        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="px-4 py-4 border-t border-gray-700">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-white text-sm font-medium truncate">{user?.razao_social || user?.username}</p>
                        <p className="text-gray-400 text-xs truncate">{user?.cnpj ? `CNPJ: ${user.cnpj}` : user?.username}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
                    <h1 className="text-lg font-semibold text-gray-800">
                        {navItems.find(n => n.to === '/' ? pathname === '/' : pathname.startsWith(n.to))?.label || 'Nota Fiscal Online'}
                    </h1>
                    <span className="text-sm text-gray-500">Olá, {user?.username}</span>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
