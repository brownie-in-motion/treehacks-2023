import React from 'react'
import { Root } from 'components/root'

import { CreditCard } from 'components/credit-card'

export const HomePage = () => {
    return <Root selected="home">
        <CreditCard
            name="John Doe"
            number="1234567890123456"
            expiry="01/23"
            cvv="123"
        />
    </Root>
}
