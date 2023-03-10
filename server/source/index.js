import path from 'path'

import express from 'express'

import router from './api.js'

const app = express()

// client
const [dist, pub] = ['dist', 'public'].map((p) => path.resolve('../client', p))
app.use(express.static(dist))
app.use(express.static(pub))

// api
app.use('/api', router)

app.use((_req, res) => {
    res.sendFile(path.resolve(pub, 'index.html'))
})

const port = process.env.PORT ?? 3000
app.listen(port, () => console.log(`listening on ${port}`))
