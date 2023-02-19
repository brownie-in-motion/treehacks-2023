import { Alert, Button, Group, Modal, Loader } from '@mantine/core'
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'
import { useLocation, Navigate } from 'react-router-dom'

import {
    useElements,
    useStripe,
    Elements,
    PaymentElement,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { FullPage } from 'components/full-page'

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

const StripeModal = ({ setDone }) => {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState(undefined)
    const loc = useLocation()
    return (
        <Modal opened={true} withCloseButton={false}>
            <PaymentElement />
            <Group>
                <Button
                    disabled={!stripe}
                    ml="auto"
                    mt="md"
                    onClick={async () => {
                        if (!stripe || !elements) return
                        const { error } = await stripe.confirmSetup({
                            elements,
                            redirect: 'if_required',
                            confirmParams: {
                                return_url: new URL(
                                    loc.pathname,
                                    origin
                                ).toString(),
                            },
                        })
                        if (error) setError(error.message)
                        else setDone(true)
                    }}
                >
                    Save
                </Button>
            </Group>
            {error && <Alert color="red" mt="md">{error}</Alert>}
        </Modal>
    )
}

const RequireStripe = ({ children, done: initDone }) => {
    const [response, fetcher] = useFetcher()
    const [done, setDone] = useState(initDone)

    useEffect(() => {
        setDone(initDone)
    }, [initDone])

    useEffect(() => {
        if (done) return
        fetcher('/api/users/me/pay/setup', { method: 'POST' })
    }, [])

    const stripePromise = useMemo(() => {
        if (done || !response.data) return
        return loadStripe(response.data.stripePublishableKey)
    }, [response])

    if (done) return children

    return (
        ((!response.data || response.loading) && (
            <FullPage>
                <Loader />
            </FullPage>
        )) || (
            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret: response.data.stripeSetupIntentSecret,
                }}
            >
                <StripeModal setDone={setDone} />
                {children}
            </Elements>
        )
    )
}

export const RequireAuth = ({ children }) => {
    const { token, user } = useLogin()
    if (!token) {
        return <Navigate to="/register" />
    }
    if (token && !user) {
        return <FullPage title=""><Loader /></FullPage>
    }
    return (
        <RequireStripe done={!!user.stripePaymentMethodId}>
            {children}
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
