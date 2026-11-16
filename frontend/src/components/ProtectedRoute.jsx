import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

/**
 * ProtectedRoute - Wrapper component that requires authentication
 * Redirects to login if user is not authenticated
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} [props.fallbackPath='/login'] - Path to redirect unauthenticated users
 */
export function ProtectedRoute({ children, fallbackPath = '/login' }) {
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        // Save the attempted location for redirect after login
        return <Navigate to={fallbackPath} state={{ from: location }} replace />
    }

    return children
}

/**
 * PublicRoute - Wrapper component for public-only pages (like login)
 * Redirects authenticated users away from public pages
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render when not authenticated
 * @param {string} [props.authenticatedPath='/'] - Path to redirect authenticated users
 */
export function PublicRoute({ children, authenticatedPath = '/' }) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return <Navigate to={authenticatedPath} replace />
    }

    return children
}