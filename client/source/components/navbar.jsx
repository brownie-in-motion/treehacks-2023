import { useNavigate } from 'react-router-dom'

import {
    Navbar,
    Group,
    Stack,
    ThemeIcon,
    UnstyledButton,
    useMantineTheme,
} from '@mantine/core'

import {
    IconCreditCard,
    IconToolsKitchen2,
    IconUsers,
    IconUserCircle,
} from '@tabler/icons-react'

export const Option = ({ Icon, color, label, selected, path }) => {
    const theme = useMantineTheme()
    const navigate = useNavigate()
    return (
        <UnstyledButton
            style={{
                background: selected && theme.colors.gray[1],
                borderRadius: theme.radius.sm,
            }}
            p="xs"
            onClick={() => navigate(path)}
        >
            <Group>
                <ThemeIcon variant="light" color={color}>
                    <Icon size={16} />
                </ThemeIcon>
                {label}
            </Group>
        </UnstyledButton>
    )
}

export const NavbarContent = ({ selected }) => {
    const items = [
        {
            Icon: IconUsers,
            color: 'blue',
            label: 'Home',
            name: 'home',
            path: '/',
        },
        {
            Icon: IconCreditCard,
            color: 'violet',
            label: 'Virtual Card',
            name: 'create',
            path: '/create',
        },
        {
            Icon: IconToolsKitchen2,
            color: 'grape',
            label: 'Reimbursement',
            name: 'scan',
            path: '/scan',
        },
    ]
    return (
        <>
            <Stack spacing={0}>
                {items.map(({ Icon, color, label, name, path }) => (
                    <Option
                        key={name}
                        Icon={Icon}
                        color={color}
                        label={label}
                        path={path}
                        selected={selected === name}
                    />
                ))}
            </Stack>
            <Navbar.Section grow></Navbar.Section>
            <Navbar.Section>
                <Option
                    Icon={IconUserCircle}
                    color="gray"
                    label="Log out"
                    name="logout"
                    path="/logout"
                />
            </Navbar.Section>
        </>
    )
}
