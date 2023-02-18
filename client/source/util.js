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
    },
    validate: {
        ...loginForm.validate,
        confirm: (value, values) =>
            value === values.password ? null : DO_NOT_MATCH,
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
        name: (value) => value.length > 5 ? null : TOO_SHORT,
        description: (value) => value.length > 5 ? null : TOO_SHORT,
        limit: (value) => value > 0 ? null : NO_LIMIT,
        duration: (value) => value > 0 ? null : NO_DURATION,
    },
}
