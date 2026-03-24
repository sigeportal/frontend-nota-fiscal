import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('nf_token'))
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nf_user')) } catch { return null }
    })

    const login = useCallback((data) => {
        localStorage.setItem('nf_token', data.token)
        localStorage.setItem('nf_user', JSON.stringify({
            user_id: data.user_id,
            username: data.username,
            cnpj: data.cnpj,
            razao_social: data.razao_social,
        }))
        setToken(data.token)
        setUser({ user_id: data.user_id, username: data.username, cnpj: data.cnpj, razao_social: data.razao_social })
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('nf_token')
        localStorage.removeItem('nf_user')
        setToken(null)
        setUser(null)
    }, [])

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
