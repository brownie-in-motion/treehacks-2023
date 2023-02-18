const INVALID_EMAIL = 'Invalid email'
const TOO_SHORT = 'Password too short'
const DO_NOT_MATCH = 'Passwords do not match'

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
