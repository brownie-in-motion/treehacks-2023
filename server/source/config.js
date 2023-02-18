import 'dotenv/config'

export default {
    jwtSecret: process.env.JWT_SECRET,
    lithicKey: process.env.LITHIC_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prd: process.env.NODE_ENV === 'production',
}
