import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NFePage from './pages/NFe/NFePage.jsx'
import NFeFormPage from './pages/NFe/NFeFormPage.jsx'
import NFeCancelarPage from './pages/NFe/NFeCancelarPage.jsx'
import NFCePage from './pages/NFCe/NFCePage.jsx'
import NFCeFormPage from './pages/NFCe/NFCeFormPage.jsx'
import NFCeCancelarPage from './pages/NFCe/NFCeCancelarPage.jsx'
import CertificadoPage from './pages/CertificadoPage.jsx'
import ConfiguracaoPage from './pages/ConfiguracaoPage.jsx'
import SefazPage from './pages/SefazPage.jsx'

function PrivateRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
    const { token } = useAuth()
    return !token ? children : <Navigate to="/" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                    <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="nfe" element={<NFePage />} />
                        <Route path="nfe/nova" element={<NFeFormPage />} />
                        <Route path="nfe/:chave/cancelar" element={<NFeCancelarPage />} />
                        <Route path="nfce" element={<NFCePage />} />
                        <Route path="nfce/nova" element={<NFCeFormPage />} />
                        <Route path="nfce/:chave/cancelar" element={<NFCeCancelarPage />} />
                        <Route path="certificados" element={<CertificadoPage />} />
                        <Route path="configuracoes" element={<ConfiguracaoPage />} />
                        <Route path="sefaz" element={<SefazPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}
