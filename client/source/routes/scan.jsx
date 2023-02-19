import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    Alert,
    Container,
    Divider,
    Grid,
    Stack,
    Text,
    Title,
    Paper,
    UnstyledButton,
} from '@mantine/core'

import { CameraNative } from 'components/camera-native'
import { PinInput } from 'components/pin-input'
import { Root } from 'components/root'

import { useFetcher } from 'util'

const RepayCard = ({ repay }) => {
    const navigate = useNavigate()
    return (
        <UnstyledButton onClick={() => navigate(`/repay/${repay.id}`)}>
            <Paper p="md" radius="md" withBorder>
                <Text>{repay.name}</Text>
                <Text ml="auto" color="gray">
                    {repay.date}
                </Text>
            </Paper>
        </UnstyledButton>
    )
}

export const ScanPage = () => {
    const navigate = useNavigate()

    const [response1, fetcher1] = useFetcher()
    const [response2, fetcher2] = useFetcher()
    const [response3, fetcher3] = useFetcher()

    useEffect(() => {
        if (response1.data) {
            navigate(`/repay/${response1.data.repayId}`)
        }
    }, [response1])

    useEffect(() => {
        if (response2.data) {
            navigate(`/repay/${response2.data.repayId}`)
        }
    }, [response2])

    useEffect(() => {
        fetcher3(`/api/repays`, {
            method: 'GET',
        })
    }, [])

    return (
        <Root selected="scan">
            <Container>
                <Grid spacing="xs">
                    <Grid.Col md={6} lg={6}>
                        <Paper p="xl" radius="md" withBorder>
                            <Stack>
                                <Title order={1} size="h4">
                                    Get reimbursed
                                </Title>
                                <CameraNative
                                    loading={response2.loading}
                                    text="Scan receipt"
                                    onData={(data) => {
                                        fetcher2('/api/repays', {
                                            method: 'POST',
                                            body: {
                                                image: data,
                                            },
                                        })
                                    }}
                                />
                                {response2.error && (
                                    <Alert color="red">{response2.error}</Alert>
                                )}
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col md={6} lg={6}>
                        <Paper p="xl" radius="md" withBorder>
                            <Stack>
                                <Title order={1} size="h4">
                                    Join reimbursement
                                </Title>
                                <PinInput
                                    length={5}
                                    onSubmit={(data) => {
                                        fetcher1(
                                            `/api/repay-invites/${data}/join`,
                                            { method: 'POST' }
                                        )
                                    }}
                                />
                            </Stack>
                            {response3.data && response3.data.length > 0 && (
                                <>
                                    <Divider mt="md" />
                                    <Title order={1} size="h4" mt="md">
                                        Previous reimbursements
                                    </Title>
                                    <Stack mt="md">
                                        {response3.data.map((repay) => (
                                            <RepayCard
                                                repay={repay}
                                                key={repay.id}
                                            />
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Container>
        </Root>
    )
}
