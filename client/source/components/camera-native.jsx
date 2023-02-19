import { Button } from '@mantine/core'

export const CameraNative = ({ text, onData, ...props }) => {
    return (
        <Button onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.capture = true
            input.accept = 'image/*'

            input.addEventListener('change', () => {
                if (input.files.length == 0) return
                const file = input.files[0]
                const reader = new FileReader()
                reader.addEventListener('loadend', () => {
                    onData(reader.result)
                })
                reader.readAsDataURL(file)
            })

            input.click()
        }} {...props} >{text}</Button>
    )
}
