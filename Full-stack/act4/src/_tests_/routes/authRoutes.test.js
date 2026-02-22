const request = require('supertest')
const app = require('../../app')
const User = require('../../models/User')
const { createTestUser } = require('../setup/testSetup')

describe('Auth Routes Integration', () => {
    describe('POST /api/auth/register', () => {
        it('debería registrar usuario exitosamente', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    password: 'password123'
                })

            expect(res.statusCode).toBe(201)
            expect(res.body.message).toBe('User registered successfully')
            
            // Verificar en BD
            const user = await User.findOne({ username: 'testuser' })
            expect(user).toBeTruthy()
            expect(user.username).toBe('testuser')
        })

        it('debería rechazar registro con datos incompletos', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser'
                    // sin password
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Missing fields')
        })
    })

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await createTestUser('loginuser', 'correctpass')
        })

        it('debería hacer login exitosamente', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'correctpass'
                })

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('accessToken')
            expect(res.body).toHaveProperty('refreshToken')
        })

        it('debería rechazar login con contraseña incorrecta', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'wrongpass'
                })

            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Invalid credentials')
        })
    })

    describe('POST /api/auth/token', () => {
        let refreshToken

        beforeEach(async () => {
            // Crear usuario y hacer login para obtener refresh token
            await createTestUser('tokenuser', 'password')
            
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'tokenuser',
                    password: 'password'
                })
            
            refreshToken = loginRes.body.refreshToken
        })

        it('debería generar nuevo access token con refresh token válido', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({ token: refreshToken })

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('accessToken')
        })

        it('debería rechazar token inválido', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({ token: 'invalid-token' })

            expect(res.statusCode).toBe(403)
        })

        it('debería rechazar petición sin token', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({})

            expect(res.statusCode).toBe(401)
        })
    })

    describe('POST /api/auth/logout', () => {
        let refreshToken
        let user

        beforeEach(async () => {
            user = await createTestUser('logoutuser', 'password')
            
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'logoutuser',
                    password: 'password'
                })
            
            refreshToken = loginRes.body.refreshToken
        })

        it('debería cerrar sesión exitosamente', async () => {
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

    describe('Flujo completo de autenticación', () => {
        it('debería manejar registro → login → refresh → logout', async () => {
    // 1. REGISTRO
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
            username: 'fullflow',
            password: 'testpass'
        })
    expect(registerRes.statusCode).toBe(201)

    // 2. LOGIN
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            username: 'fullflow',
            password: 'testpass'
        })
    expect(loginRes.statusCode).toBe(200)
    expect(loginRes.body).toHaveProperty('accessToken')
    expect(loginRes.body).toHaveProperty('refreshToken')
    
    const { accessToken, refreshToken } = loginRes.body

    // 3. USAR ACCESS TOKEN (ej: obtener productos)
    const productsRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
    expect(productsRes.statusCode).toBe(200) // Array vacío, pero autorizado

    // 4. REFRESH TOKEN
    const refreshRes = await request(app)
        .post('/api/auth/token')
        .send({ token: refreshToken })
    expect(refreshRes.statusCode).toBe(200)
    expect(refreshRes.body).toHaveProperty('accessToken')
    expect(refreshRes.body.accessToken).toBeDefined()
    
    // Verificar que es un token válido (no vacío)
    expect(refreshRes.body.accessToken.length).toBeGreaterThan(10)

    // 5. LOGOUT
    const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ token: refreshToken })
    expect(logoutRes.statusCode).toBe(204)

    // 6. VERIFICAR que refresh token ya no funciona
    const refreshAfterLogout = await request(app)
        .post('/api/auth/token')
        .send({ token: refreshToken })
    expect(refreshAfterLogout.statusCode).toBe(403)
})
    })
})