import { useEffect, useState } from 'react'

import {
    Alert,
    ActionIcon,
    Button,
    Container,
    Group,
    Stack,
    Table,
    Title,
    Text,
    Paper,
} from '@mantine/core'
import { IconCheck, IconSquare, IconSquareCheck } from '@tabler/icons-react'

import { useLoaderData } from 'react-router-dom'

import { Root } from 'components/root'
import { useFetcher, useLogin } from 'util'

export const repayLoader = ({ params }) => {
    return params.id
}

const RepayList = ({ repay, onSubmit }) => {
    const [selected, setSelected] = useState(new Set())
    const [state, setState] = useState('idle')
    const { user } = useLogin()

    const toggle = (id) => {
        const newSelected = new Set(selected)
        if (selected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelected(newSelected)
    }

    return (
        <>
            <Table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>Owed</th>
                        <th style={{ width: 1 }}>Paid</th>
                    </tr>
                </thead>
                <tbody>
                    {repay.items.map((item) => (
                        <tr key={item.id}>
                            <td>{item.description}</td>
                            <td align="right">
                                ${(item.price / 100).toFixed(2)}
                            </td>
                            <td align="right">
                                ${(item.owed / 100).toFixed(2)}
                            </td>
                            <td align="center">
                                {item.paid ? (
                                    <IconCheck size={16} color="green" />
                                ) : (
                                    <ActionIcon
                                        onClick={() => toggle(item.id)}
                                        disabled={state !== 'idle'}
                                    >
                                        {selected.has(item.id) ? (
                                            <IconSquareCheck
                                                size={20}
                                                color="gray"
                                            />
                                        ) : (
                                            <IconSquare
                                                size={20}
                                                color="gray"
                                            />
                                        )}
                                    </ActionIcon>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {selected.size > 0 && (
                <Group>
                    <Button
                        ml="auto"
                        onClick={async () => {
                            setState('loading')
                            await onSubmit(selected)
                            setState('disabled')
                        }}
                        loading={state === 'loading'}
                        disabled={state == 'disabled'}
                    >
                        {repay.owner.id === user.id ? 'Claim' : 'Pay for'}{' '}
                        {selected.size} {selected.size === 1 ? 'item' : 'items'}
                    </Button>
                </Group>
            )}
        </>
    )
}

export const RepayPage = () => {
    const id = useLoaderData()
    const { user } = useLogin()
    const [response, fetcher] = useFetcher()
    const [_response2, fetcher2] = useFetcher()
    const [response3, fetcher3] = useFetcher()

    const reload = (id) => fetcher(`/api/repays/${id}`)

    useEffect(() => {
        reload(id)
    }, [id])

    return (
        <Root selected="scan">
            <Container>
                <Paper p="xl" radius="md" withBorder>
                    {response.data && (
                        <Stack>
                            <Group>
                                <Title order={1} size="h4">
                                    {response.data.name}
                                </Title>
                                <Title
                                    order={1}
                                    size="h4"
                                    color="gray"
                                    ml="auto"
                                >
                                    {response.data.date}
                                </Title>
                            </Group>
                            <RepayList
                                repay={response.data}
                                onSubmit={async (selected) => {
                                    await fetcher2(`/api/repays/${id}/claim`, {
                                        method: 'POST',
                                        body: { itemIds: Array.from(selected) },
                                    })
                                    await reload(id)
                                }}
                            />
                        </Stack>
                    )}
                    {response.error && (
                        <Alert color="red">{response.error.message}</Alert>
                    )}
                </Paper>
                <Group>
                    <Paper
                        mt="md"
                        p="md"
                        radius="md"
                        withBorder
                        style={{ display: 'flex' }}
                        grow={0}
                        mx="auto"
                    >
                        <Group mx="auto">
                            <Title order={1} size="h4">
                                Join code:
                            </Title>
                            <Text>
                                {response.data && response.data.inviteCode}
                            </Text>
                        </Group>
                    </Paper>
                    {response.data &&
                        response.data.owner.id === user.id &&
                        response.data.items.every((item) => item.paid) && (
                            <Paper
                                mt="md"
                                p="md"
                                radius="md"
                                withBorder
                                grow={0}
                            >
                                <Button
                                    loading={response3.loading}
                                    disabled={
                                        response.data && response.data.paid
                                    }
                                    onClick={async () => {
                                        await fetcher3(
                                            `/api/repays/${id}/withdraw`,
                                            {
                                                method: 'POST',
                                            }
                                        )
                                        await reload(id)
                                    }}
                                >
                                    {response.data && response.data.paid
                                        ? 'Withdrawn!'
                                        : 'Close and withdraw'}
                                </Button>
                            </Paper>
                        )}
                </Group>
            </Container>
        </Root>
    )
}
