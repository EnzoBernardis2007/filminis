
import { createContext, useCallback, useMemo, useState, useContext } from "react"
import { sendLogin } from "../services/api"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null)
    const [refreshToken, setRefreshToken] = useState(null)

    const login = useCallback(async (email, password) => {
        const data = await sendLogin(email, password)

        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)

        return data
    }, [])

    const logout = useCallback(() => {
        setAccessToken(null)
        setRefreshToken(null)
    }, [])

    const isAuthenticated = Boolean(accessToken)

    const value = useMemo(() => ({
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout
    }), [
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout
    ])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}


export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth deve ser utilizado dentro de um AuthProvider")
    }

    return context
}
