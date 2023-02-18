import React from 'react'
import { createRoot } from 'react-dom/client'

import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { HomePage } from 'routes/home'
import { LoginPage } from 'routes/login'
import { RegisterPage } from 'routes/register'
import { CreatePage } from 'routes/create'
import { ScanPage } from 'routes/scan'
import { GroupPage, groupLoader } from 'routes/group'

const router = createBrowserRouter([
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/create', element: <CreatePage /> },
    { path: '/scan', element: <ScanPage /> },
    { path: '/group/:id', element: <GroupPage />, loader: groupLoader },
])

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <MantineProvider withGlobalStyles withNormalizeCSS>
            <RouterProvider router={router} />
        </MantineProvider>
    </React.StrictMode>
)
