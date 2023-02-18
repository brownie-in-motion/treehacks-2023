import { Container, Stack } from '@mantine/core'

import { Root } from 'components/root'
import { GroupCard } from 'components/group-card'

export const HomePage = () => {
    const groups = [
        { name: 'Apartment Spotify', members: ['00', '01', '02'], id: '0' },
        { name: 'Work Netflix', members: ['10', '11', '12'], id: '1' },
    ]
    return (
        <Root selected="home">
            <Container size="md">
                <Stack spacing="md">
                    {groups.map((group) => (
                        <GroupCard key={group.id} data={group} />
                    ))}
                </Stack>
            </Container>
        </Root>
    )
}
