const request = require('supertest')
const app = require('../../app')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const { createTestUser, generateTestTokens } = require('../setup/testSetup')

describe('Auth Controller', () => {
    describe('POST /api/auth/register', () => {
        it('debería registrar un nuevo usuario exitosamente', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    password: 'password123'
                })

            expect(res.statusCode).toBe(201)
            expect(res.body.message).toBe('User registered successfully')

            // Verificar que el usuario existe en BD
            const user = await User.findOne({ username: 'newuser' })
            expect(user).toBeTruthy()
            expect(user.username).toBe('newuser')
            // Verificar que la contraseña está hasheada
            expect(user.password).not.toBe('password123')
        })

        it('debería rechazar registro sin username', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    password: 'password123'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Missing fields')
        })

        it('debería rechazar registro sin password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Missing fields')
        })

        it('debería rechazar usuario duplicado', async () => {
            // Crear usuario primero
            await createTestUser('existinguser', 'password123')

            // Intentar registrar el mismo usuario
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'existinguser',
                    password: 'password123'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('User already exists')
        })
    })

    describe('POST /api/auth/login', () => {
        it('debería hacer login exitosamente y retornar tokens', async () => {
            // Crear usuario
            await createTestUser('loginuser', 'mypassword')

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'mypassword'
                })

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('accessToken')
            expect(res.body).toHaveProperty('refreshToken')

            // Verificar que el refresh token se guardó en BD
            const user = await User.findOne({ username: 'loginuser' })
            expect(user.refreshTokens).toContain(res.body.refreshToken)
        })

        it('debería rechazar login con credenciales incorrectas', async () => {
            await createTestUser('validuser', 'correctpass')

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'validuser',
                    password: 'wrongpass'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Invalid credentials')
        })

        it('debería rechazar login con usuario inexistente', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nosuchuser',
                    password: 'anypass'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Invalid credentials')
        })
    })

    describe('POST /api/auth/token', () => {
        it('debería generar nuevo access token con refresh token válido', async () => {
            // Crear usuario y obtener refresh token
            const user = await createTestUser('tokenuser')
            const payload = { id: user._id, username: user.username }
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
            
            user.refreshTokens.push(refreshToken)
            await user.save()

            const res = await request(app)
                .post('/api/auth/token')
                .send({ token: refreshToken })

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('accessToken')
        })

        it('debería rechazar refresh token inválido', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({ token: 'invalid-token' })

            expect(res.statusCode).toBe(403)
        })

        it('debería rechazar refresh token no guardado en BD', async () => {
            const user = await createTestUser('anotheruser')
            const payload = { id: user._id, username: user.username }
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
            
            // NO guardamos el token en BD

            const res = await request(app)
                .post('/api/auth/token')
                .send({ token: refreshToken })

            expect(res.statusCode).toBe(403)
        })
    })

    describe('POST /api/auth/logout', () => {
        it('debería eliminar refresh token exitosamente', async () => {
            // Crear usuario con refresh token
            const user = await createTestUser('logoutuser')
            const payload = { id: user._id, username: user.username }
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
            
            user.refreshTokens.push(refreshToken)
            await user.save()

            const res = await request(app)
                .post('/api/auth/logout')
                .send({ token: refreshToken })

            expect(res.statusCode).toBe(204)

            // Verificar que el token fue eliminado
            const updatedUser = await User.findById(user._id)
            expect(updatedUser.refreshTokens).not.toContain(refreshToken)
        })

        it('debería rechazar logout sin token', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .send({})

            expect(res.statusCode).toBe(400)
        })
    })
})