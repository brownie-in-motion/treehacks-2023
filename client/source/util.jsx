import { createContext, useContext, useState, useEffect } from 'react'
import { useLocalStorage } from '@mantine/hooks'

const INVALID_EMAIL = 'Invalid email'
const TOO_SHORT = 'Too short!'
const DO_NOT_MATCH = 'Passwords do not match'
const NO_LIMIT = 'Please choose a limit'
const NO_DURATION = 'Please select a duration'

export const loginForm = {
    initialValues: {
        email: '',
        password: '',
    },
    validate: {
        email: (value) => (/^\S+@\S+$/.test(value) ? null : INVALID_EMAIL),
        password: (value) => (value.length > 5 ? null : TOO_SHORT),
    },
}

export const registerForm = {
    initialValues: {
        ...loginForm.initialValues,
        confirm: '',
        name: '',
    },
    validate: {
        ...loginForm.validate,
        confirm: (value, values) =>
            value === values.password ? null : DO_NOT_MATCH,
        name: (value) => (value.length > 0 ? null : TOO_SHORT),
    },
}

export const createForm = {
    initialValues: {
        name: '',
        description: '',
        limit: 0,
        duration: 0,
    },
    validate: {
        name: (value) => (value.length > 5 ? null : TOO_SHORT),
        description: (value) => (value.length > 5 ? null : TOO_SHORT),
        limit: (value) => (value > 0 ? null : NO_LIMIT),
        duration: (value) => (value > 0 ? null : NO_DURATION),
    },
}

export const useJsonFetcher = (url, options) => {
    const fetcher = useFetcher()
    return (body) => {
        fetcher.submit(url, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
    }
}

const LoginContext = createContext()

export const LoginProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useLocalStorage('token', null)

    useEffect(() => {
        if (token) {
            void (async () => {
                const response = fetch('/api/users/me', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    method: 'GET',
                    credentials: 'include',
                })
                if (response.ok) setUser(await response.json())
                else setToken(null)
            })()
        }
    }, [token])

    return (
        <LoginContext.Provider value={{ user, token, setUser, setToken }}>
            {children}
        </LoginContext.Provider>
    )
}

export const useLogin = () => useContext(LoginContext)

export const useFetcher = (route) => {
    const [state, setState] = useState({
        loading: false,
        error: null,
        data: null,
    })
    const [token] = useLocalStorage('token', null)

    return [
        state,
        async (data, options) => {
            setState({ loading: true, error: null, data: null })

            const output = {}
            try {
                output.response = await fetch(route, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                })
                output.data = await output.response.json()
            } catch (error) {
                setState({
                    loading: false,
                    error: 'Network error!',
                    data: null,
                })
                return
            }

            if (output.response.ok) {
                setState({
                    loading: false,
                    error: null,
                    data: output.data,
                })
            } else {
                setState({
                    loading: false,
                    error: output.data.error,
                    data: null,
                })
            }
        },
    ]
}
