import { Router } from 'express'

const router = Router();

router.get('/ping', (_req, res) => {
    res.send({ result: 'pong' });
})

// 404
router.use((_req, res) => {
    res.status(404).json({ error: 'not found' })
})

export default router;
