import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AppShell,
    Navbar,
    Header,
    Text,
    MediaQuery,
    Burger,
    useMantineTheme,
} from '@mantine/core'

import { NavbarContent } from 'components/navbar'
import { useLogin } from 'util'

export const Root = ({ children, selected }) => {
    const { failed, setFailed } = useLogin()
    const navigate = useNavigate()

    useEffect(() => {
        if (failed) {
            navigate('/register', { replace: true })
            setFailed(false)
        }
    }, [failed])

    const theme = useMantineTheme()
    const [opened, setOpened] = useState(false)
    return (
        <AppShell
            styles={{
                main: {
                    background: theme.colors.gray[0],
                },
            }}
            navbarOffsetBreakpoint="sm"
            asideOffsetBreakpoint="sm"
            navbar={
                <Navbar
                    p="md"
                    hiddenBreakpoint="sm"
                    hidden={!opened}
                    width={{ sm: 250, lg: 300 }}
                >
                    <NavbarContent selected={selected} />
                </Navbar>
            }
            header={
                <Header height={{ base: 50, md: 70 }} p="md">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                        }}
                    >
                        <MediaQuery
                            largerThan="sm"
                            styles={{ display: 'none' }}
                        >
                            <Burger
                                opened={opened}
                                onClick={() => setOpened((o) => !o)}
                                size="sm"
                                color={theme.colors.gray[6]}
                                mr="xl"
                            />
                        </MediaQuery>
                        <Text>Split</Text>
                    </div>
                </Header>
            }
        >
            {children}
        </AppShell>
    )
}

