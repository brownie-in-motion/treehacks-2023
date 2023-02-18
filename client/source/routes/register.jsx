import { FullPage } from 'components/full-page'

import { Link } from 'react-router-dom'

import { useForm } from '@mantine/form'
import {
    Button,
    PasswordInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core'

import { registerForm } from 'util'

export const RegisterPage = () => {
    const form = useForm(registerForm)

    return (
        <FullPage title="Register">
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
                    <PasswordInput
                        label="Confirm Password"
                        {...form.getInputProps('confirm')}
                        autoComplete="new-password"
                    />
                    <Button mt="xs" fullWidth type="submit">
                        Register
                    </Button>
                    <Text>
                        <Link to="/login">have an account?</Link>
                    </Text>
                </Stack>
            </form>
        </FullPage>
    )
}
