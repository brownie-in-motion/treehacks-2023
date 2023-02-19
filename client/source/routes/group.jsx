import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { Root } from 'components/root'
import { useLoaderData } from 'react-router-dom'

import {
    ActionIcon,
    Button,
    Center,
    Container,
    Paper,
    Popover,
    Grid,
    Group,
    Table,
    Tabs,
    Text,
    ThemeIcon,
    Stack,
    UnstyledButton,
    NumberInput,
    useMantineTheme,
} from '@mantine/core'

import { IconCrown, IconPencil, IconPlus, IconMinus } from '@tabler/icons-react'

import { CreditCard } from 'components/credit-card'
import { useFetcher } from 'util'
import { useLogin } from 'util'

export const groupLoader = ({ params }) => {
    return params.id
}

const MemberTable = ({ members, current, onEdit }) => {
    return (
        <Table>
            <thead>
                <tr>
                    <th>
                        <Text>Name</Text>
                    </th>
                    <th>
                        <Text align="right">Weight</Text>
                    </th>
                    <th style={{ width: 1 }}>Edit</th>
                </tr>
            </thead>
            <tbody>
                {members.map(
                    ({ user: { id, email, name }, weight, isOwner }) => (
                        <tr key={id}>
                            <td>
                                <Group spacing="xs">
                                    <Text>{name}</Text>
                                    {isOwner && (
                                        <IconCrown size={16} color="gold" />
                                    )}
                                </Group>
                                <Text size="xs" color="gray">
                                    {email}
                                </Text>
                            </td>
                            <td align="right">
                                <Text>{weight}</Text>
                            </td>
                            <td>
                                {id === current && (
                                    <UnstyledButton onClick={() => onEdit()}>
                                        <ThemeIcon>
                                            <IconPencil size={16} />
                                        </ThemeIcon>
                                    </UnstyledButton>
                                )}
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </Table>
    )
}

const Pie = ({ a, b }) => {
    const theme = useMantineTheme()
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const amount = (a / (a + b)) * circumference
    return (
        <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill={theme.colors.gray[0]} />
            <circle
                cx="50"
                cy="50"
                r={radius / 2}
                fill="none"
                stroke={theme.colors.blue[1]}
                strokeWidth={radius}
                strokeDasharray={`${amount / 2} ${circumference / 2}`}
            />
        </svg>
    )
}

const WeightEdit = ({ start, others, onUpdate, onCancel }) => {
    const [loading, setLoading] = useState(false)
    const [weight, setWeight] = useState(start)
    const handlers = useRef()
    return (
        <Stack>
            <Container>
                <Stack>
                    <Pie a={weight} b={others} />
                    <Group spacing={5}>
                        <ActionIcon
                            size={36}
                            variant="default"
                            onClick={() => handlers.current.decrement()}
                        >
                            <IconMinus size={16} />
                        </ActionIcon>

                        <NumberInput
                            hideControls
                            value={weight}
                            onChange={setWeight}
                            handlersRef={handlers}
                            min={1}
                            styles={{
                                input: {
                                    width: 60,
                                },
                            }}
                        />

                        <ActionIcon
                            size={36}
                            variant="default"
                            onClick={() => handlers.current.increment()}
                        >
                            <IconPlus size={16} />
                        </ActionIcon>
                    </Group>
                </Stack>
            </Container>
            <Group ml="auto">
                <Button color="red" onClick={() => onCancel()}>
                    Cancel
                </Button>
                <Button
                    onClick={async () => {
                        setLoading(true)
                        await onUpdate(weight)
                        setLoading(false)
                    }}
                    loading={loading}
                >
                    Save
                </Button>
            </Group>
        </Stack>
    )
}

const Flash = ({ disabled, timeout, label, children, onChange }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    return (
        <Popover
            width={200}
            position="bottom"
            withArrow
            shadow="sm"
            opened={open}
            onChange={setOpen}
        >
            <Popover.Target>
                <Button
                    disabled={disabled}
                    loading={loading}
                    onClick={async () => {
                        setLoading(true)
                        await onChange()
                        setLoading(false)
                        setOpen(true)
                        setTimeout(() => setOpen(false), timeout)
                    }}
                >
                    {label}
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                <Text size="sm" color="gray">
                    {children}
                </Text>
            </Popover.Dropdown>
        </Popover>
    )
}

const InfoTabs = ({
    me,
    total,
    fetcher,
    setEdit,
    reload,
    edit,
    sorted,
    user,
    transactions,
    id,
}) => {
    return (
        <Paper p="xl" radius="md" withBorder>
            <Tabs defaultValue="members" variant="outline">
                <Tabs.List>
                    <Tabs.Tab value="members">Members</Tabs.Tab>
                    <Tabs.Tab value="transactions">Transactions</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="members" pt="xl">
                    {sorted.length > 0 &&
                        (edit ? (
                            <WeightEdit
                                start={me.weight}
                                others={total}
                                onCancel={() => setEdit(false)}
                                onUpdate={async (weight) => {
                                    await fetcher(
                                        `/api/groups/${id}/members/me`,
                                        {
                                            method: 'PATCH',
                                            body: { weight },
                                        }
                                    )
                                    await reload()
                                    setEdit(false)
                                }}
                            />
                        ) : (
                            <MemberTable
                                members={sorted}
                                current={user.id}
                                onEdit={() => setEdit(true)}
                            />
                        ))}
                </Tabs.Panel>
                <Tabs.Panel value="transactions" pt="xl">
                    {transactions && (
                        <Table>
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Merchant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>
                                            ${transaction.amount.toFixed(2)}
                                        </td>
                                        <td>{transaction.merchant}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Paper>
    )
}

export const GroupPage = () => {
    const id = useLoaderData()
    const [edit, setEdit] = useState(false)
    const { user, token } = useLogin()
    const [response, fetcher] = useFetcher()

    const copyInvite = useCallback(async () => {
        const response = await fetch(`/api/groups/${id}/invites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
        const { code } = await response.json()
        const url = new URL(window.location.href)
        url.pathname = `/invite/${code}`

        await navigator.clipboard.writeText(url.toString())
    }, [id, token])

    const reload = () => fetcher(`/api/groups/${id}`, { method: 'GET' })

    useEffect(() => {
        reload()
    }, [id])

    const { members, total, me, transactions } = useMemo(() => {
        if (!user) return { members: [], total: 0 }
        if (!response.data) return { members: [], total: 0 }

        const members = [...response.data.members]
        members.sort((a, b) => a.user.name.localeCompare(b.user.name))
        const others = members
            .filter((m) => m.user.id !== user.id)
            .reduce((acc, m) => acc + m.weight, 0)
        const me = members.find((m) => m.user.id === user.id)
        const transactions = [...response.data.events]
            .filter((e) => e.type === 'spend')
            .map((e) => ({
                amount: e.data.amount / 100,
                merchant: e.data.merchant,
                id: e.id,
            }))
        return { members, total: others, me, transactions }
    }, [response, user])

    return (
        <Root selected="home">
            <Container>
                <Grid spacing="xs">
                    <Grid.Col md={6} lg={6}>
                        <Container size={400}>
                            <CreditCard name="Company Name" group={id}>
                                Virtual Card
                            </CreditCard>
                        </Container>
                    </Grid.Col>
                    <Grid.Col md={6} lg={6}>
                        <InfoTabs
                            me={me}
                            total={total}
                            fetcher={fetcher}
                            setEdit={setEdit}
                            reload={reload}
                            edit={edit}
                            sorted={members}
                            user={user}
                            transactions={transactions}
                            id={id}
                        />
                        {me?.isOwner && (
                            <Paper p="xl" radius="md" mt="md" withBorder>
                                <Center>
                                    <Flash
                                        disabled={!user}
                                        timeout={1000}
                                        label="Add member"
                                        onChange={copyInvite}
                                    >
                                        Copied invite link to clipboard!
                                    </Flash>
                                </Center>
                            </Paper>
                        )}
                    </Grid.Col>
                </Grid>
            </Container>
        </Root>
    )
}
