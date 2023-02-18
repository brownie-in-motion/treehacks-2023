import React from 'react'

import {
    Button,
    Container,
    NumberInput,
    Paper,
    Select,
    Stack,
    Textarea,
    TextInput,
    Title
} from '@mantine/core'
import { useForm } from '@mantine/form'

import { IconCurrencyDollar } from '@tabler/icons-react'

import { Root } from 'components/root'
import { createForm } from 'util'

export const CreatePage = () => {
    const form = useForm(createForm)

    const durations = [
        { label: 'every week', value: 1 },
        { label: 'every month', value: 2 },
        { label: 'every year', value: 3 },
        { label: 'forever', value: 4 },
    ]

    return (
        <Root selected="create">
            <Container>
                <Paper p="xl" radius="md" withBorder>
                    <Title order={1} size="h4">Create payment group</Title>
                    <form onSubmit={form.onSubmit((data) => console.log(data))}>
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
                            <Button ml="auto" mt="xs" type="submit">
                                Create
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Root>
    )
}
