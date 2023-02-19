import { useState, useEffect } from 'react'

import { NumberInput } from '@mantine/core'

export const PinInput = ({ length, onSubmit }) => {
    const [value, setValue] = useState()

    useEffect(() => {
        if (value === undefined) return
        const string = value.toString()
        if (string.length === length) onSubmit(string)
    }, [value])

    return (
        <NumberInput
            value={value}
            onChange={setValue}
            placeholder="00000"
            hideControls
            autoComplete="off"
            maxLength={length}
        />
    )
}
