import config from './config.js'

const endpoint = `https://${config.prd ? 'www' : 'sandbox'}.checkbook.io/v3/check/digital`

export const send = async (user, amount) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `${config.checkbookApiKey}:${config.checkbookApiSecret}`,
    },
    body: JSON.stringify({
      recipient: user.email,
      name: user.name,
      amount: amount / 100,
    }),
  })
  if (res.status !== 200) {
    throw new Error(`checkbook: ${res.status}`)
  }
}
