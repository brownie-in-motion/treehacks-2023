import Lithic from 'lithic'
import config from './config.js'

const lithic = new Lithic({
    apiKey: config.lithicKey,
    environment: config.prd ? 'production' : 'sandbox',
})

export const createCard = async ({ spendLimit, spendLimitDuration }) => {
    const card = await lithic.cards.create({
        type: 'VIRTUAL',
        spend_limit: spendLimit,
        spend_limit_duration: spendLimitDuration,
    })
    return card.token
}

export const getCardInfo = async (token) => {
    const card = await lithic.cards.retrieve(token)
    return {
        pan: card.pan,
        cvv: card.cvv,
        expMonth: card.exp_month,
        expYear: card.exp_year,
    }
}
