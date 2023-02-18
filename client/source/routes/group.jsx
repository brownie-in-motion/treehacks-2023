import React from 'react'
import { Root } from 'components/root'
import { useLoaderData } from 'react-router-dom'

import { CreditCard } from 'components/credit-card'

export const groupLoader = ({ params }) => {
    return params.id
}

export const GroupPage = () => {
    const id = useLoaderData()
    return <Root selected="home">
        <CreditCard
            name="John Doe"
            number="1234567890123456"
            expiry="01/23"
            cvv="123"
        >
            Group {id} Virtual Card
        </CreditCard>
    </Root>
}


