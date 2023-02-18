import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useForm } from '@mantine/form'
import {
    Alert,
    Button,
    PasswordInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core'

import { loginForm, registerForm, useLogin, useFetcher } from 'util'

export const LoginForm = ({ register }) => {
    const choice = register
        ? {
              form: registerForm,
              path: '/api/register',
              text: 'Register',
              alternate: (
                  <Text>
                      <Link to="/login">have an account?</Link>
                  </Text>
              ),
          }
        : {
              form: loginForm,
              path: '/api/login',
              text: 'Log in',
              alternate: (
                  <Text>
                      or <Link to="/register">make an account!</Link>
                  </Text>
              ),
          }

    const form = useForm(choice.form)
    const navigate = useNavigate()
    const { setToken } = useLogin()
    const [data, fetch] = useFetcher(choice.path)

    useEffect(() => {
        if (data.data) {
            setToken(data.data.token)
            navigate('/')
        }
    }, [data])

    const extra = register
        ? {
              before: (
                  <TextInput
                      label="Name"
                      {...form.getInputProps('name')}
                      autoComplete="name"
                  />
              ),
              after: (
                  <PasswordInput
                      label="Confirm Password"
                      {...form.getInputProps('confirm')}
                      autoComplete="new-password"
                  />
              ),
          }
        : {}

    return (
        <form
            onSubmit={form.onSubmit((data) => fetch(data, { method: 'POST' }))}
        >
            <Stack spacing="xs">
                {extra.before}
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
                {extra.after}
                <Button mt="xs" fullWidth type="submit" loading={data.loading}>
                    {choice.text}
                </Button>
                {choice.alternate}
                {data.error && <Alert color="red">{data.error}</Alert>}
            </Stack>
        </form>
    )
}
