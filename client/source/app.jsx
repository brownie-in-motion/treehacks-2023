// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { RequireAuth, RequireUnauth, LoginProvider } from 'util'

import { HomePage } from 'routes/home'
import { LoginPage } from 'routes/login'
import { RegisterPage } from 'routes/register'
import { CreatePage } from 'routes/create'
import { ScanPage } from 'routes/scan'
import { InvitePage, inviteLoader } from 'routes/invite'
import { GroupPage, groupLoader } from 'routes/group'
import { RepayPage, repayLoader } from 'routes/repay'
import { LogoutPage } from 'routes/logout'

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <RequireAuth>
                <HomePage />
            </RequireAuth>
        ),
    },
    {
        path: '/login',
        element: (
            <RequireUnauth>
                <LoginPage />
            </RequireUnauth>
        ),
    },
    {
        path: '/register',
        element: (
            <RequireUnauth>
                <RegisterPage />
            </RequireUnauth>
        ),
    },
    {
        path: '/create',
        element: (
            <RequireAuth>
                <CreatePage />
            </RequireAuth>
        ),
    },
    {
        path: '/scan',
        element: (
            <RequireAuth>
                <ScanPage />
            </RequireAuth>
        ),
    },
    {
        path: '/invite/:id',
        element: (
            <RequireAuth>
                <InvitePage />
            </RequireAuth>
        ),
        loader: inviteLoader,
    },
    {
        path: '/group/:id',
        element: (
            <RequireAuth>
                <GroupPage />
            </RequireAuth>
        ),
        loader: groupLoader,
    },
    {
        path: '/repay/:id',
        element: (
            <RequireAuth>
                <RepayPage />
            </RequireAuth>
        ),
        loader: repayLoader,
    },
    {
        path: '/logout',
        element: (
            <RequireAuth>
                <LogoutPage />
            </RequireAuth>
        ),
    },
])

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
        <LoginProvider>
            <RouterProvider router={router} />
        </LoginProvider>
    </MantineProvider>
    // </StrictMode>
)
