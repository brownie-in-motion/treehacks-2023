import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    Button,
    Container,
    NumberInput,
    Paper,
    Select,
    Stack,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'

import { IconCurrencyDollar } from '@tabler/icons-react'

import { Root } from 'components/root'
import { useFetcher, createForm } from 'util'

export const CreatePage = () => {
    const form = useForm(createForm)
    const navigate = useNavigate()

    const [data, fetch] = useFetcher()

    const durations = [
        { label: 'every transaction', value: 'TRANSACTION' },
        { label: 'every month', value: 'MONTHLY' },
        { label: 'every year', value: 'ANNUALLY' },
        { label: 'forever', value: 'FOREVER' },
    ]

    useEffect(() => {
        if (data.data) navigate(`/group/${data.data.groupId}`)
    }, [data])

    return (
        <Root selected="create">
            <Container>
                <Paper p="xl" radius="md" withBorder>
                    <Title order={1} size="h4">
                        Create payment group
                    </Title>
                    <form
                        onSubmit={form.onSubmit(
                            ({ name, description, limit, duration }) =>
                                fetch('/api/groups', {
                                    body: {
                                        name,
                                        description,
                                        spendLimit: limit * 100,
                                        spendLimitDuration: duration,
                                    },
                                    method: 'POST',
                                })
                        )}
                    >
                        <Stack spacing="xs" mt="md">
                            <TextInput
                                label="Name"
                                {...form.getInputProps('name')}
                            />
                            <Textarea
                                label="Description"
                                {...form.getInputProps('description')}
                            />
                            <NumberInput
                                label="Spending limit"
                                {...form.getInputProps('limit')}
                                min={0}
                                icon={<IconCurrencyDollar size={16} />}
                                precision={2}
                            />
                            <Select
                                label="Limit duration"
                                {...form.getInputProps('duration')}
                                data={durations}
                            />
                            <Button
                                ml="auto"
                                mt="xs"
                                type="submit"
                                loading={data.loading}
                            >
                                Create
                            </Button>
                            {data.error && (
                                <Alert color="red">{data.error}</Alert>
                            )}
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Root>
    )
}
