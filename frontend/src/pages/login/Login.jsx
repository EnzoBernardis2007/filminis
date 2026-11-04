import Button from "../../components/button/Button"
import { Field, FieldLabel, FieldDescription, FieldError, FieldHint } from "../../components/field/Field"
import Input from "../../components/input/Input"
import styles from './login.module.css'
import commonStyles from '../../app.module.css'
import { useState } from "react"

function Login() {
    const [email, setEmail] = useState("")

    const handleEmail = (e) => {
        setEmail(e.target.value)
    }

    return (
        <div className={`${commonStyles.flex} ${commonStyles.justifyCenter} ${commonStyles.itemsCenter} ${commonStyles.hScreen}`}>
            <div style={{ width: 640 }}>
                <Field required>
                    <FieldLabel>E-mail</FieldLabel>
                    <Input 
                        type="email" 
                        name="email" 
                        placeholder="seu@email.com"
                        fullWidth
                        onChange={handleEmail}
                    />
                    <FieldHint>{email.length}/320 caractéres</FieldHint>
                    <FieldError>E-mail inválido ou obrigatório.</FieldError>
                </Field>

                <Field required>
                    <FieldLabel>Senha</FieldLabel>
                    <Input 
                        type="password" 
                        name="senha" 
                        placeholder="Sua senha"
                        fullWidth
                    />
                    <FieldHint>Sua senha deve ter no minimo 8 caracteres e conter números, letras e símbolos</FieldHint>
                    <FieldError>A senha é obrigatória.</FieldError>
                </Field>

                <div className={`${commonStyles.wFull} ${commonStyles.flex}`}>
                    <Button variant="secondary" fullWidth>Limpar</Button>
                    <Button fullWidth>Entrar</Button>
                </div>
            </div>
        </div>
    )
}

export default Login