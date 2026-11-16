import { useEffect, useState } from "react"
import { useAuth } from "../../contexts/useAuth"
import styles from './profile.module.css'
import commonStyles from '../../app.module.css'

export default function Profile() {
    const { api, isAuthenticated, logout } = useAuth()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchProfile() {
            if (!isAuthenticated) {
                setError('Não autenticado')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const userData = await api.me()
                setUser(userData)
            } catch (err) {
                setError(err.message || 'Erro ao carregar perfil')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [api, isAuthenticated])

    const handleLogout = async () => {
        await logout()
    }

    if (loading) {
        return (
            <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen}`}>
                <p>Carregando perfil...</p>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen}`}>
                <div className={styles.errorContainer}>
                    <p>{error || 'Usuário não encontrado'}</p>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Fazer login novamente
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter}`}>
            <div style={{ width: 640 }}>
                <div className={styles.profileCard}>
                    <h2 className={commonStyles.sectionTitle}>Perfil do Usuário</h2>
                    <div className={styles.profileInfo}>
                        <div className={styles.profileField}>
                            <label>Nome</label>
                            <span>{user.name || user.username || 'Não informado'}</span>
                        </div>
                        <div className={styles.profileField}>
                            <label>E-mail</label>
                            <span>{user.email || 'Não informado'}</span>
                        </div>
                        <div className={styles.profileField}>
                            <label>ID</label>
                            <span>{user.id || 'Não informado'}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Sair
                    </button>
                </div>
            </div>
        </div>
    )
}