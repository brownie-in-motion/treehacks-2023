import { useEffect } from 'react'
import { useNavigate, useLoaderData } from 'react-router-dom'

import { Alert, Button, Text } from '@mantine/core'

import { useFetcher } from 'util'
import { FullPage } from 'components/full-page'

export const inviteLoader = ({ params }) => {
    return params.id
}

export const InvitePage = () => {
    const id = useLoaderData()
    const [data, fetcher] = useFetcher()
    const [data2, fetcher2] = useFetcher()

    const navigate = useNavigate()

    useEffect(() => {
        fetcher(`/api/invites/${id}`)
    }, [id])

    useEffect(() => {
        if (data2.data) {
            navigate(`/group/${data2.data.groupId}`)
        }
    }, [data2.data])

    return (
        <>
            {data.data && (
                <FullPage title={`Accept Invite: ${data.data.name}`}>
                    <Text>Spend limit: {data.data.spendLimit / 100}</Text>
                    <Text>Limit duration: {data.data.spendLimitDuration}</Text>
                    <Button
                        onClick={() => {
                            fetcher2(`/api/invites/${id}/join`, {
                                method: 'POST',
                            })
                        }}
                    >Join group</Button>
                    {data2.error && (
                        <Alert color="red">
                            You can't join this group. Are you already in it?
                        </Alert>
                    )}
                </FullPage>
            )}
            {data.error && (
                <FullPage title="Accept Invite">
                    <Alert>Sorry! We couldn't find that invite.</Alert>
                </FullPage>
            )}
        </>
    )
}
