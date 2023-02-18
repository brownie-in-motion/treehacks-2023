import React from 'react'
import { createRoot } from 'react-dom/client'

import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { HomePage } from 'routes/home'
import { CreatePage } from 'routes/create'
import { ScanPage } from 'routes/scan'
import { GroupPage, groupLoader } from 'routes/group'

const router = createBrowserRouter([
    { path: '/', element: <HomePage /> },
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
