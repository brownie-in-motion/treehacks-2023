import 'dotenv/config'

export default {
    jwtSecret: process.env.JWT_SECRET,
    lithicKey: process.env.LITHIC_KEY,
    stripeKey: process.env.STRIPE_KEY,
    prd: process.env.NODE_ENV === 'production',
}
