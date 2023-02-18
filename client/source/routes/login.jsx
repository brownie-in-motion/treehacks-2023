import { FullPage } from 'components/full-page'

import { Link } from 'react-router-dom'

import { useForm } from '@mantine/form'
import {
    Button,
    Center,
    Title,
    PasswordInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core'

import { loginForm } from 'util'

export const LoginPage = () => {
    const form = useForm(loginForm)

    return (
        <FullPage title="Login">
            <form onSubmit={form.onSubmit((values) => console.log(values))}>
                <Stack spacing="xs">
                    <TextInput
                        label="Email"
                        {...form.getInputProps('email')}
                        autoComplete="email"
                    />
                    <PasswordInput
                        label="Password"
                        {...form.getInputProps('password')}
                        autoComplete="new-password"
                    />
                    <Button mt="xs" fullWidth type="submit">
                        Register
                    </Button>
                    <Text>
                        or <Link to="/register">make an account!</Link>
                    </Text>
                </Stack>
            </form>
        </FullPage>
    )
}
