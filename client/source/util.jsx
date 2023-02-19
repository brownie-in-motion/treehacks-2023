import { Modal, Loader } from '@mantine/core'
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'
import { Navigate } from 'react-router-dom'

import { Elements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { useFetcher } from 'util'

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx')

const RequireStripe = ({ children, stripe }) => {
    const [response, fetcher] = useFetcher()

    if (stripe) return children

    useEffect(() => {
        fetcher('/users/me/pay/setup', { method: 'POST' })
    }, [])

    return (
        (response.loading && <Loader />) ||
        <Elements
            stripe={stripePromise}
            options={{ clientSecret: response.data.stripeSetupIntentSecret }}
        >
            <Modal opened={true}>
                <PaymentElement />
            </Modal>
            {children}
        </Elements>
    )
}

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
        duration: undefined,
    },
    validate: {
        name: (value) => (value.length > 0 ? null : TOO_SHORT),
        description: (value) => (value.length > 0 ? null : TOO_SHORT),
        limit: (value) => (value > 0 ? null : NO_LIMIT),
        duration: (value) => (value === null ? NO_DURATION : null),
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
    const [user, setUser] = useState()
    const [token, setToken] = useState(localStorage.token)

    useEffect(() => {
        const listener = (e) => {
            if (e.key === 'token') {
                setToken(e.newValue)
            }
        }
        window.addEventListener('storage', listener)
        return () => window.removeEventListener('storage', listener)
    }, [])

    const handleToken = useCallback((newToken) => {
        setToken(newToken)
        if (newToken === undefined) {
            delete localStorage.token
        } else {
            localStorage.token = newToken
        }
    }, [])

    useEffect(() => {
        if (!token) {
            return
        }
        void (async () => {
            const response = await fetch('/api/users/me', {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                method: 'GET',
                credentials: 'include',
            })
            if (response.status === 200) {
                setUser(await response.json())
            } else {
                handleToken()
            }
        })()
    }, [token, handleToken])

    const context = useMemo(
        () => ({ user, token, setToken: handleToken }),
        [user, token, handleToken]
    )

    return (
        <LoginContext.Provider value={context}>
            {children}
        </LoginContext.Provider>
    )
}

export const useLogin = () => useContext(LoginContext)

export const useFetcher = () => {
    const [state, setState] = useState({
        loading: false,
        error: null,
        data: null,
    })
    const { token } = useLogin()

    return [
        state,
        async (route, options) => {
            setState({ loading: true, error: null, data: null })

            const output = {}
            try {
                output.response = await fetch(route, {
                    ...(options ?? {}),
                    headers: {
                        ...(options?.headers ?? {}),
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: options?.body && JSON.stringify(options.body),
                })
                output.data = await output.response.json()
            } catch (error) {
                console.error(error)
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

export const RequireAuth = ({ children }) => {
    const { token, user } = useLogin()
    if (!token) {
        return <Navigate to="/register" />
    }
    if (token && !user) {
        return <Loader />
    }
    return (
        <RequireStripe stripe={!!user.stripePaymentMethodId}>
            children
        </RequireStripe>
    )
}

export const RequireUnauth = ({ children }) => {
    const { token } = useLogin()
    if (token) {
        return <Navigate to="/" />
    }
    return children
}
