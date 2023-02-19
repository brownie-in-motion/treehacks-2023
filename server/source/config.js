import 'dotenv/config'

export default {
    jwtSecret: process.env.JWT_SECRET,
    lithicKey: process.env.LITHIC_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    googleDocumentAiProcessor: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR,
    checkbookApiKey: process.env.CHECKBOOK_API_KEY,
    checkbookApiSecret: process.env.CHECKBOOK_API_SECRET,
    prd: process.env.NODE_ENV === 'production',
}
