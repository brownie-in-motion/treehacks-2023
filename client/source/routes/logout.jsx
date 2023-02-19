import { useEffect } from 'react'
import { useLogin } from 'util'

export const LogoutPage = () => {
    const { setToken } = useLogin()
    useEffect(() => {
        setToken()
    }, [])
    return null
}
