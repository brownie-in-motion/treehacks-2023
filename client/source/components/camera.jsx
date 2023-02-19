import { useEffect, useState, useRef } from 'react'
import { Button, Stack, Modal } from '@mantine/core'

export const CameraLauncher = ({ text, onData }) => {
    const [enabled, setEnabled] = useState(false)

    const video = useRef(null)
    const stream = useRef(null)

    useEffect(() => {
        if (!enabled) {
            if (stream.current) {
                stream.current.getTracks().forEach((track) => track.stop())
                stream.current = null
            }
            return
        }
        void (async () => {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 1280 },
                },
            }
            stream.current = await navigator.mediaDevices.getUserMedia(
                constraints
            )
            video.current.srcObject = stream.current
        })()
    }, [enabled])

    return (
        <>
            <Modal opened={enabled} onClose={() => setEnabled(false)}>
                <Stack>
                <video autoPlay playsInline muted ref={video} style={{
                    width: '100%',
                    height: 'auto',
                }}/>
                <Button
                    m="auto"
                    onClick={() => {
                        const canvas = document.createElement('canvas')
                        canvas.width = video.current.videoWidth
                        canvas.height = video.current.videoHeight
                        const ctx = canvas.getContext('2d')
                        ctx.drawImage(video.current, 0, 0)
                        const data = canvas.toDataURL('image/png')
                        onData(data)
                        setEnabled(false)
                    }}
                >Capture</Button>
                </Stack>
            </Modal>
            <Button
                onClick={() => {
                    setEnabled(true)
                }}
            >
                {text}
            </Button>
        </>
    )
}
