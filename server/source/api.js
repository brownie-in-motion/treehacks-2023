import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import config from './config.js'
import * as db from './db.js'
import { createCard, getCardInfo } from './lithic.js'

const router = Router()
router.use(bodyParser.json())

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

router.get('/me', auth, (req, res) => {
    res.json(req.user)
})

router.get('/groups', auth, async (req, res) => {
    const groups = db.getShareGroupsForUser(req.user.id)
    res.json(groups)
})

router.post('/groups', auth, async (req, res) => {
    const { name, spendLimit, spendLimitDuration } = req.body
    const cardToken = await createCard({ spendLimit, spendLimitDuration })
    const groupId = db.createShareGroup(
        req.user.id,
        name,
        cardToken,
        spendLimit,
        spendLimitDuration
    )
    res.json({ groupId })
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
    res.json(await getCardInfo(group.cardToken))
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

router.post('/invites/:code/join', auth, (req, res) => {
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
