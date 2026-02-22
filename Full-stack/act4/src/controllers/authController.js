const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ message: 'Missing fields' })
        }

        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new User({
            username,
            password: hashedPassword
        })

        await user.save()

        res.status(201).json({ message: 'User registered successfully' })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body

        const user = await User.findOne({ username })
        if (!user) return res.status(400).json({ message: 'Invalid credentials' })

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' })

        const payload = { id: user._id, username: user.username }

        const accessToken = generateAccessToken(payload)
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)

        user.refreshTokens.push(refreshToken)
        await user.save()

        res.json({ accessToken, refreshToken })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.refreshToken = async (req, res) => {
    const { token } = req.body
    if (!token) return res.sendStatus(401)

    const user = await User.findOne({ refreshTokens: token })
    if (!user) return res.sendStatus(403)

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403)

        const accessToken = generateAccessToken({
            id: decoded.id,
            username: decoded.username
        })

        res.json({ accessToken })
    })
}

exports.logout = async (req, res) => {
    const { token } = req.body
    if (!token) return res.sendStatus(400)

    const user = await User.findOne({ refreshTokens: token })
    if (!user) return res.sendStatus(403)

    user.refreshTokens = user.refreshTokens.filter(t => t !== token)
    await user.save()

    res.sendStatus(204)
}