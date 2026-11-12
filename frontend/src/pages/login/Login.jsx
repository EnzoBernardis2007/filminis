
import Button from "../../components/button/Button"
import { Field, FieldLabel, FieldError, FieldHint } from "../../components/field/Field"
import Input from "../../components/input/Input"
import styles from './login.module.css'
import commonStyles from '../../app.module.css'
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from 'react-router-dom';

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false)

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const isPasswordValid = password.length > 0 && hasAttemptedLogin

    const handleEmail = (e) => {
        setEmail(e.target.value)
    }

    const handlePassword = (e) => {
        setPassword(e.target.value)
    }

    const handleClear = () => {
        setEmail("")
        setPassword("")
        setHasAttemptedLogin(false)
    }

    const handleLogin = async (e) => {
        e.preventDefault()

        setHasAttemptedLogin(true)

        if (!isEmailValid || !isPasswordValid) {
            return
        }

        setLoading(true)

        try {
            const data = await login(email, password)
            
            navigate("/")
        } catch (error) {
            console.error("Erro ao realizar login:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen} ${styles.loginContainer}`}>

            <div className={styles.bgSvgWrapper}>
                <svg className={styles.bgSvg} width="740" height="666" viewBox="0 0 740 666" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.1921 16L598.025 632.5M164.192 16H27.1921L369.692 632.5L712.192 16H575.192M712.192 16L141.359 632.5M164.192 16C164.192 16 213.551 187.25 369.692 187.25C525.833 187.25 575.192 16 575.192 16M164.192 16H575.192M369.692 84.5C304.633 84.5 284.067 16 284.067 16H455.317C455.317 16 434.751 84.5 369.692 84.5Z" strokeWidth="32" stroke="white"/>
                </svg>
            </div>

            <form className={styles.formWrapper} style={{ width: 640 }} onSubmit={handleLogin}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <h2 className={commonStyles.sectionTitle}>Entrar</h2>
                    <p style={{ color: "#fff" }}>Faça parte da maior comunidade de cinefilia do Brasil!</p>
                </div>

                <Field required>
                    <FieldLabel>E-mail</FieldLabel>
                    <Input
                        type="email"
                        name="email"
                        placeholder="seu@email.com"
                        fullWidth
                        value={email}
                        onChange={handleEmail}
                    />
                    <FieldHint>{email.length}/320 caracteres</FieldHint>

                    {hasAttemptedLogin && !isEmailValid && (
                        <FieldError>
                            Insira um e-mail inválido.
                        </FieldError>
                    )}
                </Field>

                <Field required>
                    <FieldLabel>Senha</FieldLabel>
                    <Input
                        type="password"
                        name="password"
                        placeholder="Sua senha"
                        fullWidth
                        value={password}
                        onChange={handlePassword}
                    />
                    <FieldHint>
                        Sua senha deve ter no mínimo 8 caracteres e conter números, letras e símbolos.
                    </FieldHint>

                    {hasAttemptedLogin && !isPasswordValid && (
                        <FieldError>
                            Insira uma senha válida.
                        </FieldError>
                    )}
                </Field>

                <div className={`${commonStyles.wFull} ${commonStyles.flex}`} style={{ gap: 12 }}>
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={handleClear}
                    >
                        Limpar
                    </Button>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        disabled={loading}
                    >
                        Entrar
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Login
