import Lithic from 'lithic'
import config from './config.js'
import crypto from 'crypto'

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

export const updateCard = async (token, payable) => {
    await lithic.cards.update(token, {
        state: payable ? 'OPEN' : 'PAUSED',
    })
}

export const closeCard = async (token) => {
    await lithic.cards.update(token, {
        state: 'CLOSED',
    })
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

export const verifySource = (transaction, headers) => {
    const requestHmac = Buffer.from(headers['x-lithic-hmac'], 'base64')

    const replacer = (_key, value) =>
        value instanceof Object && !(value instanceof Array)
            ? Object.keys(value)
                  .sort()
                  .reduce((sorted, key) => {
                      sorted[key] = value[key]
                      return sorted
                  }, {})
            : value

    const requestJson = JSON.stringify(transaction, replacer)
    const dataHmac = crypto
        .createHmac('sha256', config.lithicKey)
        .update(requestJson)
        .digest()

    if (dataHmac.length !== requestHmac.length) return false
    return crypto.timingSafeEqual(dataHmac, requestHmac)
}
