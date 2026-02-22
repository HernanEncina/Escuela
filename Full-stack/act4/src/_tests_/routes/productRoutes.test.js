const request = require('supertest')
const app = require('../../app')
const Product = require('../../models/Product')
const { createTestUser, createTestProduct } = require('../setup/testSetup')

describe('Product Routes Integration', () => {
    let testUser
    let accessToken
    let refreshToken

    beforeEach(async () => {
        // Crear usuario y hacer login
        testUser = await createTestUser('routeuser', 'password123')
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'routeuser',
                password: 'password123'
            })
        
        accessToken = loginRes.body.accessToken
        refreshToken = loginRes.body.refreshToken
    })

    describe('Protección de rutas', () => {
        it('debería rechazar acceso sin token', async () => {
            const res = await request(app)
                .get('/api/products')
            expect(res.statusCode).toBe(401)
        })

        it('debería rechazar acceso con token inválido', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', 'Bearer invalid.token.here')
            expect(res.statusCode).toBe(403)
        })

        it('debería permitir acceso con token válido', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
            expect(res.statusCode).toBe(200)
        })
    })

    describe('POST /api/products', () => {
        it('debería crear producto con todos los campos', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Test Product',
                    price: 99.99,
                    description: 'Test Description'
                })

            expect(res.statusCode).toBe(201)
            expect(res.body.name).toBe('Test Product')
            expect(res.body.price).toBe(99.99)
            expect(res.body.description).toBe('Test Description')
            expect(res.body.createdBy).toBe(testUser._id.toString())
        })

        it('debería crear producto sin descripción', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Minimal Product',
                    price: 49.99
                })

            expect(res.statusCode).toBe(201)
            expect(res.body.name).toBe('Minimal Product')
        })
    })

    describe('GET /api/products', () => {
        it('debería obtener solo productos del usuario', async () => {
            // Crear productos para este usuario
            await createTestProduct(testUser._id, { name: 'Product 1', price: 10 })
            await createTestProduct(testUser._id, { name: 'Product 2', price: 20 })

            // Crear otro usuario con productos
            const otherUser = await createTestUser('otheruser')
            await createTestProduct(otherUser._id, { name: 'Other Product', price: 30 })

            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.length).toBe(2)
            expect(res.body.map(p => p.name)).toEqual(
                expect.arrayContaining(['Product 1', 'Product 2'])
            )
            expect(res.body.map(p => p.name)).not.toContain('Other Product')
        })
    })

    describe('PUT /api/products/:id', () => {
        it('debería actualizar producto propio', async () => {
            const product = await createTestProduct(testUser._id, {
                name: 'Original',
                price: 100
            })

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated',
                    price: 200
                })

            expect(res.statusCode).toBe(200)
            expect(res.body.name).toBe('Updated')
            expect(res.body.price).toBe(200)
        })

        it('debería rechazar actualización de producto de otro usuario', async () => {
            const otherUser = await createTestUser('otheruser2')
            const product = await createTestProduct(otherUser._id, {
                name: 'Not Mine',
                price: 500
            })

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Hacked'
                })

            expect(res.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/products/:id', () => {
        it('debería eliminar producto propio', async () => {
            const product = await createTestProduct(testUser._id)

            const res = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(204)

            const deleted = await Product.findById(product._id)
            expect(deleted).toBeNull()
        })

        it('debería rechazar eliminación de producto de otro usuario', async () => {
            const otherUser = await createTestUser('otheruser3')
            const product = await createTestProduct(otherUser._id)

            const res = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(404)

            const stillExists = await Product.findById(product._id)
            expect(stillExists).toBeTruthy()
        })
    })

    describe('Flujo completo CRUD', () => {
        it('debería manejar crear → leer → actualizar → eliminar', async () => {
            // 1. CREAR
            const createRes = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'CRUD Product',
                    price: 150,
                    description: 'Testing CRUD'
                })
            expect(createRes.statusCode).toBe(201)
            const productId = createRes.body._id

            // 2. LEER (verificar que está en la lista)
            const getRes = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
            expect(getRes.body.length).toBe(1)
            expect(getRes.body[0].name).toBe('CRUD Product')

            // 3. ACTUALIZAR
            const updateRes = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated CRUD',
                    price: 200
                })
            expect(updateRes.statusCode).toBe(200)
            expect(updateRes.body.name).toBe('Updated CRUD')

            // 4. ELIMINAR
            const deleteRes = await request(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`)
            expect(deleteRes.statusCode).toBe(204)

            // 5. VERIFICAR eliminación
            const finalGet = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
            expect(finalGet.body.length).toBe(0)
        })
    })
})