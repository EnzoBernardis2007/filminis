const url = 'http://localhost:8000'

/**
 * Decodes a JWT token payload without verification (client-side only)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeJwt(token) {
    if (!token || typeof token !== 'string') return null

    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) return null

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

/**
 * Checks if a JWT token is expired or about to expire
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Buffer time in seconds before expiry (default: 30s)
 * @returns {boolean} True if token is expired or about to expire
 */
function isTokenExpired(token, bufferSeconds = 30) {
    const payload = decodeJwt(token)
    if (!payload || !payload.exp) return true

    const expiryTime = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    return now >= (expiryTime - bufferSeconds * 1000)
}

/**
 * Creates an authenticated fetch wrapper with automatic token refresh
 * @param {Function} getAuth - Function that returns current auth context (accessToken, refreshToken, setAccessToken, setRefreshToken)
 * @returns {Function} Authenticated fetch function
 */
function createAuthenticatedFetch(getAuth) {
    return async function authenticatedFetch(endpoint, options = {}) {
        const { accessToken, refreshToken, setAccessToken, setRefreshToken } = getAuth()

        // Check if we have tokens
        if (!accessToken || !refreshToken) {
            throw new Error('Não autenticado: tokens não disponíveis')
        }

        // Attempt the request with current access token
        const attemptRequest = async (token) => {
            const response = await fetch(`${url}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers,
                },
            })

            return response
        }

        // First attempt with current access token
        if (!isTokenExpired(accessToken)) {
            const response = await attemptRequest(accessToken)

            // If successful or not a 401, return response
            if (response.status !== 401) {
                return response
            }
        }

        // Access token expired or got 401 - try refresh token
        // Re-read tokens in case they were updated
        const currentAuth = getAuth()
        if (isTokenExpired(currentAuth.refreshToken)) {
            // Refresh token also expired - clear auth and throw
            setAccessToken(null)
            setRefreshToken(null)
            throw new Error('Sessão expirada: faça login novamente')
        }

        // Try to refresh the access token
        try {
            const refreshResponse = await fetch(`${url}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentAuth.refreshToken}`,
                },
            })

            if (!refreshResponse.ok) {
                // Refresh failed - clear auth and throw
                setAccessToken(null)
                setRefreshToken(null)
                throw new Error('Falha ao renovar sessão: faça login novamente')
            }

            const refreshData = await refreshResponse.json()
            const newAccessToken = refreshData.access_token
            const newRefreshToken = refreshData.refresh_token

            // Update tokens in context
            setAccessToken(newAccessToken)
            if (newRefreshToken) {
                setRefreshToken(newRefreshToken)
            }

            // Retry original request with new access token
            const retryResponse = await attemptRequest(newAccessToken)

            if (retryResponse.status === 401) {
                // Still getting 401 after refresh - clear auth
                setAccessToken(null)
                setRefreshToken(null)
                throw new Error('Sessão inválida: faça login novamente')
            }

            return retryResponse
        } catch (error) {
            // Network error or other failure during refresh
            setAccessToken(null)
            setRefreshToken(null)
            throw error
        }
    }
}

/**
 * Creates a public fetch wrapper (no auth) for endpoints that don't require authentication
 * @returns {Function} Public fetch function
 */
function createPublicFetch() {
    return async function publicFetch(endpoint, options = {}) {
        const response = await fetch(`${url}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        return response
    }
}

/**
 * Higher-order function to create API functions with auth
 * @param {Function} getAuth - Function that returns current auth context
 * @returns {object} API functions
 */
export function createApi(getAuth) {
    const authenticatedFetch = createAuthenticatedFetch(getAuth)
    const publicFetch = createPublicFetch()

    return {
        /**
         * Fetches the current user's profile (/me endpoint)
         * @returns {Promise<object>} User data
         */
        async me() {
            const response = await authenticatedFetch('/me')

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao buscar perfil do usuário')
            }

            return data
        },

        /**
         * Fetches movie listings (public endpoint)
         * @returns {Promise<Array>} List of movies
         */
        async movies() {
            const response = await publicFetch('/listagem')
            return await response.json()
        },

        /**
         * Fetches a single movie by ID (public endpoint)
         * @param {string|number} id - Movie ID
         * @returns {Promise<object>} Movie details
         */
        async movieById(id) {
            const response = await publicFetch(`/filme?id=${id}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao buscar detalhes do filme')
            }

            return data
        },

        /**
         * Performs user login
         * @param {string} email - User email
         * @param {string} password - User password
         * @returns {Promise<object>} Login response with tokens
         */
        async sendLogin(email, password) {
            const response = await fetch(`${url}/send_loginho`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar login')
            }

            return data
        },

        /**
         * Logs out the user (calls backend logout if needed)
         * @returns {Promise<void>}
         */
        async logout() {
            try {
                await authenticatedFetch('/logout', { method: 'POST' })
            } catch {
                // Ignore logout errors - we'll clear local tokens anyway
            }
        },

        /**
         * Updates the current user's profile (PATCH /edit/me)
         * @param {object} profileData - Profile data to update
         * @param {string} [profileData.nome] - User's first name
         * @param {string} [profileData.sobrenome] - User's last name
         * @param {string} [profileData.apelido] - User's nickname
         * @param {string} [profileData.data_nascimento] - User's birth date (YYYY-MM-DD)
         * @param {string} [profileData.foto] - User's profile photo URL
         * @returns {Promise<object>} Success message
         */
        async updateProfile(profileData) {
            const response = await authenticatedFetch('/edit/me', {
                method: 'PATCH',
                body: JSON.stringify(profileData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar perfil')
            }

            return data
        },
    }
}