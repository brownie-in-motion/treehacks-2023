import { FullPage } from 'components/full-page'
import { LoginForm } from 'components/login-form'

export const RegisterPage = () => {
    return (
        <FullPage title="Register">
            <LoginForm register />
        </FullPage>
    )
}
