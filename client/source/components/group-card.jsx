import { useNavigate } from 'react-router-dom'

import { Group, Text, Paper, UnstyledButton } from '@mantine/core'

export const GroupCard = ({ data: { id, name, members } }) => {
    const navigate = useNavigate()
    return (
        <UnstyledButton onClick={() => navigate(`/group/${id}`)}>
            <Paper p="xl" radius="md" withBorder>
                <Group>
                    <Text>{name}</Text>
                    <Group ml="auto">
                        <Text>Members:</Text>
                        <Text>{members.length}</Text>
                    </Group>
                </Group>
            </Paper>
        </UnstyledButton>
    )
}
