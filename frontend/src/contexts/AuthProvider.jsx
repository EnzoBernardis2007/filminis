import { useCallback, useMemo, useState, useEffect } from "react"
import { AuthContext } from "./AuthContext"
import { createApi } from "../services/api"
import { decodeJwt } from "../services/api"

const TOKEN_STORAGE_KEY = 'auth_tokens'

// Initialize tokens from localStorage
function getInitialTokens() {
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (stored) {
            const { accessToken, refreshToken } = JSON.parse(stored)
            return { accessToken, refreshToken }
        }
    } catch (e) {
        console.warn('Failed to parse stored auth tokens:', e)
    }
    return { accessToken: null, refreshToken: null }
}

// Extract user role from access token
function getUserRole(accessToken) {
    if (!accessToken) return null
    const payload = decodeJwt(accessToken)
    return payload?.role || null
}

// Persist tokens to localStorage
function saveTokens(accessToken, refreshToken) {
    try {
        if (accessToken && refreshToken) {
            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }))
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
    } catch (e) {
        console.warn('Failed to save auth tokens:', e)
    }
}

export function AuthProvider({ children }) {
    const { accessToken: initialAccessToken, refreshToken: initialRefreshToken } = getInitialTokens()

    const [accessToken, setAccessToken] = useState(initialAccessToken)
    const [refreshToken, setRefreshToken] = useState(initialRefreshToken)

    // Derive user role from access token
    const userRole = useMemo(() => getUserRole(accessToken), [accessToken])
    const isAdmin = userRole === 'admin'

    // Persist tokens to localStorage whenever they change
    useEffect(() => {
        saveTokens(accessToken, refreshToken)
    }, [accessToken, refreshToken])

    // Function that returns current auth state for API consumption
    const getAuth = useCallback(() => ({
        accessToken,
        refreshToken,
        setAccessToken,
        setRefreshToken,
    }), [accessToken, refreshToken])

    // Create API instance with auth getter
    const api = useMemo(() => createApi(getAuth), [getAuth])

    const login = useCallback(async (email, password) => {
        const data = await api.sendLogin(email, password)

        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)

        return data
    }, [api])

    const logout = useCallback(async () => {
        try {
            await api.logout()
        } finally {
            setAccessToken(null)
            setRefreshToken(null)
        }
    }, [api])

    const isAuthenticated = Boolean(accessToken)

    const value = useMemo(() => ({
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout,
        api,
        getAuth,
        userRole,
        isAdmin,
    }), [
        accessToken,
        refreshToken,
        isAuthenticated,
        login,
        logout,
        api,
        getAuth,
        userRole,
        isAdmin,
    ])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}