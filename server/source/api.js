import crypto from 'crypto'
import { promisify } from 'util'
import express, { Router } from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import config from './config.js'
import * as db from './db.js'
import * as lithic from './lithic.js'

const router = Router()

const scrypt = promisify(crypto.scrypt)
const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16)
    const buf = await scrypt(password, salt, 64)
    return Buffer.concat([salt, buf]).toString('base64url')
}
const verifyPasswordHash = async (password, hash) => {
    const buf = Buffer.from(hash, 'base64url')
    const [salt, key] = [buf.subarray(0, 16), buf.subarray(16)]
    return crypto.timingSafeEqual(await scrypt(password, salt, 64), key)
}
const normalizeEmail = (email) => email.trim().toLowerCase()
const signToken = (id) => jwt.sign({ sub: id }, config.jwtSecret)
const auth = (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token) {
        res.status(401).json({ error: 'unauthorized' })
        return
    }
    try {
        const { sub } = jwt.verify(token, config.jwtSecret)
        req.user = db.getUser(sub)
        next()
    } catch {
        res.status(401).json({ error: 'unauthorized' })
    }
}

const hasPayment = (req, res, next) => {
    if (req.user.payment_method_id) {
        next()
    } else {
        res.status(400).json({ error: 'no payment method' })
    }
}

const stripe = Stripe(config.stripeKey)

const updateLithicCardStatuses = async (userId) => {
    const payability = db.getShareGroupPayabilityForUser(userId)
    for (const { card_token, is_payable } of payability) {
        await lithic.updateCard(card_token, is_payable)
    }
}

router.post('/hooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret)
    } catch {
        res.status(400).json({ error: 'invalid signature' })
        return
    }
    if (event.type === 'setup_intent.succeeded') {
        const setupIntent = event.data.object
        const user = db.getUserByStripeCustomerId(setupIntent.customer)
        db.updateUserStripePaymentMethodId(user.id, setupIntent.payment_method)
        await updateLithicCardStatuses(user.id)
    } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object
        const user = db.getUserByStripeCustomerId(paymentIntent.customer)
        db.createShareGroupPayEvent(user.id, user.share_group_id, {
            amount: paymentIntent.amount,
        })
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object
        const user = db.getUserByStripeCustomerId(paymentIntent.customer)
        db.updateUserStripePaymentMethodId(user.id, null)
        db.createShareGroupPayErrorEvent(user.id, user.share_group_id, {
            amount: paymentIntent.amount,
        })
        await updateLithicCardStatuses(user.id)
    } else {
        res.status(400).json({ error: 'invalid event type' })
        return
    }
    res.sendStatus(204)
})

router.use(bodyParser.json())

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = db.getUserByEmail(normalizeEmail(email))
    if (!user) {
        res.status(401).json({ error: 'unknown email' })
        return
    }
    if (!(await verifyPasswordHash(password, user.password))) {
        res.status(403).json({ error: 'invalid password' })
        return
    }
    res.json({ token: signToken(user.id) })
})

router.post('/register', async (req, res) => {
    const { email, name, password } = req.body
    const userId = db.createUser(
        normalizeEmail(email),
        name,
        await hashPassword(password)
    )
    if (!userId) {
        res.status(409).json({ error: 'email already exists' })
        return
    }
    res.json({ token: signToken(userId) })
})

router.get('/users/me', auth, (req, res) => {
    res.json(req.user)
})

router.post('/users/me/pay/setup', auth, async (req, res) => {
    let customerId = req.user.stripe_customer_id
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: req.user.email,
            name: req.user.name,
        })
        customerId = customer.id
        db.updateUser(req.user.id, { stripe_customer_id: customerId })
    }
    const setupIntent = await stripe.setupIntents.create({ customer: customerId })
    res.json({
        stripePublishableKey: config.stripePublishableKey,
        stripeSetupIntentSecret: setupIntent.client_secret
    })
})

router.post('/hooks/lithic', async (req, res) => {
    if (!lithic.verifySource(req.body, req.headers)) {
        res.status(400).json({ error: 'invalid signature' })
        return
    }
    const group = db.getShareGroupByCardToken(req.body.card_token)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    const { members } = db.getShareGroup(group.id)
    const totalWeight = group.users.reduce((acc, u) => acc + u.weight, 0)
    const shareCost = Math.ceil(total / totalWeight)
    const shareDifference = db.upsertLithicTransaction(group.id, shareCost)
    for (const member of members) {
        const amount = shareDifference * member.weight
        if (amount < 50) {
            // stripe minimum is $0.50
            continue
        }
        await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            customer: user.stripe_customer_id,
            payment_method: user.payment_method_id,
            off_session: true,
            confirm: true,
            statement_descriptor: req.body.merchant.descriptor,
        })
    }
})

router.get('/groups', auth, async (req, res) => {
    const groups = db.getShareGroupsForUser(req.user.id)
    res.json(groups)
})

router.post('/groups', auth, hasPayment, async (req, res) => {
    const { name, description, spendLimit, spendLimitDuration } = req.body
    const cardToken = await lithic.createCard({ spendLimit, spendLimitDuration })
    const groupId = db.createShareGroup(
        req.user.id,
        name,
        description,
        cardToken,
        spendLimit,
        spendLimitDuration
    )
    res.json({ groupId })
})

router.delete('/groups/:id', auth, async (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isOwner(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    await lithic.deleteCard(group.cardToken)
    db.deleteShareGroup(group.id)
    res.json({ ok: true })
})

router.get('/groups/:id', auth, (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isMember(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    if (!db.isOwner(group, req.user)) {
        delete group.invites
    }
    res.json(group)
})

router.get('/groups/:id/card', auth, async (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isMember(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    res.json(await lithic.getCardInfo(group.cardToken))
})

router.delete('/groups/:id/members/:userId', auth, (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isOwner(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    if (!db.deleteShareGroupMember(req.params.userId, group.id)) {
        res.status(400).json({ error: 'cannot remove' })
        return
    }
    res.json({ ok: true })
})

router.delete('/groups/:id/members/me', auth, (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isMember(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    if (!db.deleteShareGroupMember(req.user.id, group.id)) {
        res.status(400).json({ error: 'cannot remove member' })
        return
    }
    res.json({ ok: true })
})

router.patch('/groups/:id/members/me', auth, (req, res) => {
    const { weight } = req.body
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isMember(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    db.updateShareGroupMemberWeight(
        req.user.id,
        group.id,
        weight
    )
    res.json({ ok: true })
})

router.post('/groups/:id/invites', auth, (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isOwner(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    const code = crypto.randomBytes(8).toString('base64url')
    db.createShareGroupInvite(code, group.id)
    res.json({ code })
})

router.delete('/groups/:id/invites/:code', auth, (req, res) => {
    const group = db.getShareGroup(req.params.id)
    if (!group) {
        res.status(404).json({ error: 'group not found' })
        return
    }
    if (!db.isOwner(group, req.user)) {
        res.status(403).json({ error: 'forbidden' })
        return
    }
    if (!db.deleteShareGroupInvite(req.params.code, group.id)) {
        res.status(404).json({ error: 'invite not found' })
        return
    }
    res.json({ ok: true })
})

router.get('/invites/:code', (req, res) => {
    const group = db.getShareGroupByInvite(req.params.code)
    if (!group) {
        res.status(404).json({ error: 'invite not found' })
        return
    }
    res.json(group)
})

router.post('/invites/:code/join', auth, hasPayment, (req, res) => {
    const groupId = db.joinShareGroup(req.user.id, req.params.code)
    if (!groupId) {
        res.status(400).json({ error: 'cannot join group' })
        return
    }
    res.json({ groupId })
})

// 404
router.use((_req, res) => {
    res.status(404).json({ error: 'not found' })
})

export default router
