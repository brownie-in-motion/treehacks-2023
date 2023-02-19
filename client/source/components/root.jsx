import { useState } from 'react'
import {
    AppShell,
    Group,
    Navbar,
    Header,
    Title,
    MediaQuery,
    Burger,
    useMantineTheme,
} from '@mantine/core'

import { NavbarContent } from 'components/navbar'

export const Root = ({ children, selected }) => {
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
                        <Group spacing={0}>
                            <MediaQuery
                                smallerThan="sm"
                                styles={{ display: 'none' }}
                            >
                                <img
                                    src="/logo.svg"
                                    alt="logo"
                                    style={{ height: 30, marginRight: 10 }}
                                />
                            </MediaQuery>
                            <Title size="h3">SplitPay</Title>
                        </Group>
                    </div>
                </Header>
            }
        >
            {children}
        </AppShell>
    )
}
