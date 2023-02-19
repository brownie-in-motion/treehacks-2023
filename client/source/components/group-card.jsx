import { useNavigate } from 'react-router-dom'

import { Group, Text, Title, Paper, UnstyledButton } from '@mantine/core'

export const GroupCard = ({ data: { id, name, memberCount } }) => {
    const navigate = useNavigate()
    return (
        <UnstyledButton onClick={() => navigate(`/group/${id}`)}>
            <Paper p="xl" radius="md" withBorder>
                <Group>
                    <Title order={1} size="h4">
                        {name}
                    </Title>
                    <Group ml="auto">
                        <Text>Members:</Text>
                        <Text>{memberCount}</Text>
                    </Group>
                </Group>
            </Paper>
        </UnstyledButton>
    )
}
