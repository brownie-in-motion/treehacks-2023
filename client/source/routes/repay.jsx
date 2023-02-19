import { useState } from 'react'

import {
    ActionIcon,
    Button,
    Container,
    Group,
    Stack,
    Table,
    Title,
    Paper,
} from '@mantine/core'
import { IconCheck, IconSquare, IconSquareCheck } from '@tabler/icons-react'

import { useLoaderData } from 'react-router-dom'

import { Root } from 'components/root'

export const repayLoader = ({ params }) => {
    return params.id
}

const RepayList = ({ repay, onSubmit }) => {
    const [selected, setSelected] = useState(new Set())
    const [state, setState] = useState('idle')

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
                        <th style={{ width: 1 }}>Claimed</th>
                    </tr>
                </thead>
                <tbody>
                    {repay.items.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td align="right">
                                ${(item.price / 100).toFixed(2)}
                            </td>
                            <td align="right">
                                ${(item.owed / 100).toFixed(2)}
                            </td>
                            <td align="center">
                                {item.claimed ? (
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
                        {repay.owner ? 'Claim' : 'Pay for'} {selected.size}{' '}
                        {selected.size === 1 ? 'item' : 'items'}
                    </Button>
                </Group>
            )}
        </>
    )
}

export const RepayPage = () => {
    const id = useLoaderData()

    const repay = {
        date: '2021-01-01',
        supplier: 'Shake Shack',
        owner: false,
        items: [
            {
                name: 'shake',
                price: 599,
                owed: 721,
                id: 1,
                claimed: true,
            },
            {
                name: 'shack',
                price: 1099,
                owed: 1204,
                id: 2,
                claimed: false,
            },
            {
                name: 'fries',
                price: 499,
                owed: 600,
                id: 3,
                claimed: false,
            },
        ],
    }

    return (
        <Root selected="scan">
            <Container>
                <Paper p="xl" radius="md" withBorder>
                    <Stack>
                        <Group>
                            <Title order={1} size="h4">
                                {repay.supplier}
                            </Title>
                            <Title order={1} size="h4" color="gray" ml="auto">
                                {repay.date}
                            </Title>
                        </Group>
                        <RepayList
                            repay={repay}
                            onSubmit={async () => {
                                await new Promise((resolve) =>
                                    setTimeout(resolve, 1000)
                                )
                            }}
                        />
                    </Stack>
                </Paper>
            </Container>
        </Root>
    )
}
