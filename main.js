const express = require('express')
const { sign, decode } = require('jsonwebtoken')
const { registerNewSession, renderChallenge, handleInput } = require('./js/challenges')
const app = express()
const port = process.env.PORT || 3000
const tokenSecret = process.env.SECRET || 'dev-secret-161065485'

app.use(express.static('./public'));
app.use(express.json())
app.get('/api/newChallenge', (req, res) => {
    const sessionId = registerNewSession()
    const token = sign({ sub: sessionId }, tokenSecret, { expiresIn: '10m' })

    res.json(token);
})

app.get('/api/gameScreen', async (req, res) => {
    if (req.query?.token) {
        
        let decoded = decode(req.query.token, tokenSecret)

        res.json(await renderChallenge(decoded.sub))
        return
    }
    res.status(404).end()
})
app.post('/api/gameInputs', (req, res) => {
    if (req.query?.token) {
        let decoded = decode(req.query.token, tokenSecret)
        console.log(decoded);
        
        handleInput(decoded.sub, req.body.direction)
        res.status(200).end()
        return
    }
    res.status(404).end()
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
