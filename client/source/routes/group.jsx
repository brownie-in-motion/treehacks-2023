import { useState, useRef } from 'react'
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
                {members.map(({ id, email, name, weight, owner }) => (
                    <tr key={id}>
                        <td>
                            <Group spacing="xs">
                                <Text>{name}</Text>
                                {owner && <IconCrown size={16} color="gold" />}
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
                ))}
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

const WeightEdit = ({ id, start, others, onCancel }) => {
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
                <Button>Save</Button>
            </Group>
        </Stack>
    )
}

export const GroupPage = () => {
    const id = useLoaderData()

    const [edit, setEdit] = useState(false)

    const me = '00'
    const members = [
        { name: 'John Doe', email: 'jodoe@gmail.com', id: '00', weight: 1 },
        {
            name: 'Jane Doe',
            email: 'jadoe@outlook.com',
            id: '01',
            weight: 1,
            owner: true,
        },
        {
            name: 'Darren Smith',
            email: 'darren@outlook.com',
            id: '02',
            weight: 1,
        },
        {
            name: 'Thomas Anderson',
            email: 'thomasa@gmail.com',
            id: '03',
            weight: 2,
        },
    ]
    members.sort((a, b) => a.name.localeCompare(b.name))

    // sum of other weights
    const others = members
        .filter((m) => m.id !== me)
        .reduce((acc, m) => acc + m.weight, 0)

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
                                    id={me}
                                    start={1}
                                    others={others}
                                    onCancel={() => setEdit(false)}
                                />
                            ) : (
                                <MemberTable
                                    members={members}
                                    current={me}
                                    onEdit={() => setEdit(true)}
                                />
                            )}
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Container>
        </Root>
    )
}
