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
 * AdminProtectedRoute - Wrapper component that requires admin role
 * Redirects to movies page if user is not admin
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render when user is admin
 * @param {string} [props.fallbackPath='/movies'] - Path to redirect non-admin users
 */
export function AdminProtectedRoute({ children, fallbackPath = '/movies' }) {
    const { isAuthenticated, isAdmin } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        // Not logged in - redirect to login
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!isAdmin) {
        // Logged in but not admin - redirect to fallback
        return <Navigate to={fallbackPath} replace />
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