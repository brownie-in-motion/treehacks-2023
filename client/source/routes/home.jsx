import { useEffect } from 'react'

import { Alert, Container, Stack } from '@mantine/core'

import { useFetcher } from 'util'

import { Root } from 'components/root'
import { GroupCard } from 'components/group-card'

export const HomePage = () => {
    const [data, fetch] = useFetcher()

    useEffect(() => {
        fetch('/api/groups')
    }, [])

    return (
        <Root selected="home">
            <Container size="md">
                {data.data && (
                    <Stack spacing="md">
                        {data.data.map((group) => (
                            <GroupCard key={group.id} data={group} />
                        ))}
                    </Stack>
                )}
                {data.error && <Alert color="red">{data.error}</Alert>}
            </Container>
        </Root>
    )
}
