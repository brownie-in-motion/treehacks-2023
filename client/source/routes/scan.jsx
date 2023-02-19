import { useNavigate } from 'react-router-dom'

import {
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

const RepayCard = ({ repay }) => {
    const navigate = useNavigate()
    return (
        <UnstyledButton onClick={() => navigate(`/repay/${repay.id}`)}>
            <Paper p="md" radius="md" withBorder>
                <Text>{repay.supplier}</Text>
                <Text ml="auto" color="gray">
                    {repay.date}
                </Text>
            </Paper>
        </UnstyledButton>
    )
}

export const ScanPage = () => {
    const repays = [
        { id: 0, supplier: 'Shake Shack', date: '2021-01-01' },
        { id: 1, supplier: 'McDonalds', date: '2021-01-02' },
        { id: 2, supplier: 'Burger King', date: '2021-01-03' },
    ]

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
                                    text="Scan receipt"
                                    onData={(data) => {
                                        console.log(data)
                                    }}
                                />
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
                                        console.log(data)
                                    }}
                                />
                            </Stack>
                            {repays.length > 0 && (
                                <>
                                    <Divider mt="md" />
                                    <Title order={1} size="h4" mt="md">
                                        Previous reimbursements
                                    </Title>
                                    <Stack mt="md">
                                        {repays.map((repay) => (
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
