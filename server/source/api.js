import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import config from './config.js'
import { createUser, getUser } from './db.js'

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
        req.user = getUser(sub)
        next()
    } catch (err) {
        res.status(401).json({ error: 'unauthorized' })
    }
}

router.get('/ping', auth, (req, res) => {
    res.send({ result: req.user })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = getUser(normalizeEmail(email))
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
    const { email, password } = req.body
    const userId = createUser(
        normalizeEmail(email),
        await hashPassword(password)
    )
    if (!userId) {
        res.status(409).json({ error: 'email already exists' })
        return
    }
    res.json({ token: signToken(userId) })
})

// 404
router.use((_req, res) => {
    res.status(404).json({ error: 'not found' })
})

export default router
