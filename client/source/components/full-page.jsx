import { Stack, Title, Center } from '@mantine/core'

export const FullPage = ({ title, children }) => (
    <Center
        style={{
            height: '100vh',
        }}
    >
        <Stack>
            <Center><Title>{title}</Title></Center>
            {children}
        </Stack>
    </Center>
)
