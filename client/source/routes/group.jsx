import { useEffect, useState, useMemo, useRef } from 'react'
import { Root } from 'components/root'
import { useLoaderData } from 'react-router-dom'

import {
    ActionIcon,
    Button,
    Container,
    Paper,
    Grid,
    Group,
    Table,
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

export const GroupPage = () => {
    const id = useLoaderData()
    const [edit, setEdit] = useState(false)
    const { user } = useLogin()
    const [response, fetch] = useFetcher()

    const reload = () => fetch(`/api/groups/${id}`, { method: 'GET' })

    useEffect(() => {
        reload()
    }, [id])

    const { sorted, total, weight } = useMemo(() => {
        if (!user) return { sorted: [], total: 0 }
        if (!response.data) return { sorted: [], total: 0 }

        const members = [...response.data.members]
        members.sort((a, b) => a.name.localeCompare(b.name))
        const others = members
            .filter((m) => m.user.id !== user.id)
            .reduce((acc, m) => acc + m.weight, 0)
        const me = members.find((m) => m.user.id === user.id)
        return { sorted: members, total: others, weight: me.weight }
    }, [response, user])

    return (
        <Root selected="home">
            <Container>
                <Grid spacing="xs">
                    <Grid.Col md={6} lg={6}>
                        <Container size={400}>
                            <CreditCard
                                name="John Doe"
                                number="1234567890123456"
                                expiry="01/23"
                                cvv="123"
                            >
                                Group {id} Virtual Card
                            </CreditCard>
                        </Container>
                    </Grid.Col>
                    <Grid.Col md={6} lg={6}>
                        <Paper p="xl" radius="md" withBorder>
                            {edit ? (
                                <WeightEdit
                                    start={weight}
                                    others={total}
                                    onCancel={() => setEdit(false)}
                                    onUpdate={async (weight) => {
                                        await fetch(
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
                                sorted.length > 0 && (
                                    <MemberTable
                                        members={sorted}
                                        current={user.id}
                                        onEdit={() => setEdit(true)}
                                    />
                                )
                            )}
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Container>
        </Root>
    )
}
