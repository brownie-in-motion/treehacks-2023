import { useState } from 'react'

import {
    AspectRatio,
    Box,
    Group,
    Text,
    Paper,
    useMantineTheme,
} from '@mantine/core'

const Blurrable = ({ children, blur }) => {
    return (
        <Box
            style={{
                filter: blur ? 'blur(6px)' : 'none',
                margin: '-2rem',
                padding: '2rem',
                overflow: 'visible',
            }}
        >
            {children}
        </Box>
    )
}

const Label = ({ children }) => {
    const theme = useMantineTheme()
    return (
        <Text size="xs" color={theme.colors.gray[6]}>
            {children}
        </Text>
    )
}

export const CreditCard = ({ name, number, expiry, cvv, children }) => {
    const [revealed, setRevealed] = useState(false)
    const segments = number.match(/.{1,4}/g)
    return (
        <Paper
            shadow="md"
            p="xl"
            radius="md"
            style={{
                cursor: 'pointer',
                maxWidth: 400,
            }}
            onClick={() => setRevealed((r) => !r)}
        >
            <AspectRatio ratio={1.58}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateRows: '2fr repeat(3, 2rem)',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gridTemplateAreas: `
                            "content content content"
                            "name name name"
                            "number number number"
                            "expiry cvv cvv"
                        `,
                        overflow: 'visible',
                    }}
                >
                    <Box style={{ gridArea: 'content' }}>{children}</Box>
                    <Text style={{ gridArea: 'name' }}>{name}</Text>
                    <pre style={{ gridArea: 'number' }}>
                        <Blurrable blur={!revealed}>
                            {segments.map((segment, i) => (
                                <span key={i}>
                                    {segment}
                                    {i < segments.length - 1 && ' '}
                                </span>
                            ))}
                        </Blurrable>
                    </pre>
                    <Group style={{ gridArea: 'expiry' }} spacing="xs">
                        <Label>EXP</Label>{' '}
                        <Blurrable blur={!revealed}>{expiry}</Blurrable>
                    </Group>
                    <Group style={{ gridArea: 'cvv' }} spacing="xs">
                        <Label>CVV</Label>
                        <Blurrable blur={!revealed}>{cvv}</Blurrable>
                    </Group>
                </div>
            </AspectRatio>
        </Paper>
    )
}
