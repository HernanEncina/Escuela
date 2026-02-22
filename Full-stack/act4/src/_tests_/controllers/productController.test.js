const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../../app')
const Product = require('../../models/Product')
const { createTestUser, createTestProduct, generateTestTokens } = require('../setup/testSetup')

describe('Product Controller', () => {
    let testUser
    let accessToken

    beforeEach(async () => {
        // Crear usuario y token para cada test
        testUser = await createTestUser('productuser')
        const tokens = generateTestTokens(testUser._id, testUser.username)
        accessToken = tokens.accessToken
    })

    describe('POST /api/products', () => {
        it('debería crear un producto exitosamente', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'New Product',
                    price: 199.99,
                    description: 'Awesome product'
                })

            expect(res.statusCode).toBe(201)
            expect(res.body).toHaveProperty('name', 'New Product')
            expect(res.body).toHaveProperty('price', 199.99)
            expect(res.body).toHaveProperty('description', 'Awesome product')
            expect(res.body).toHaveProperty('createdBy', testUser._id.toString())

            // Verificar en BD
            const product = await Product.findById(res.body._id)
            expect(product).toBeTruthy()
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
            expect(res.body.description).toBeUndefined()
        })

        it('debería rechazar producto sin nombre', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    price: 199.99
                })

            expect(res.statusCode).toBe(500)
        })

        it('debería rechazar producto sin precio', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'No Price Product'
                })

            expect(res.statusCode).toBe(500)
        })

        it('debería rechazar creación sin token', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({
                    name: 'Unauthorized Product',
                    price: 99.99
                })

            expect(res.statusCode).toBe(401)
        })

        it('debería rechazar creación con token inválido', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', 'Bearer invalid.token.here')
                .send({
                    name: 'Invalid Token Product',
                    price: 99.99
                })

            expect(res.statusCode).toBe(403)
        })
    })

    describe('GET /api/products', () => {
        it('debería obtener solo productos del usuario', async () => {
            // Crear productos para este usuario
            await createTestProduct(testUser._id, { name: 'User Product 1', price: 10 })
            await createTestProduct(testUser._id, { name: 'User Product 2', price: 20 })

            // Crear otro usuario y sus productos
            const otherUser = await createTestUser('otheruser')
            await createTestProduct(otherUser._id, { name: 'Other User Product', price: 30 })

            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body.length).toBe(2)
            
            // Verificar que solo tiene sus productos
            const productNames = res.body.map(p => p.name)
            expect(productNames).toContain('User Product 1')
            expect(productNames).toContain('User Product 2')
            expect(productNames).not.toContain('Other User Product')
        })

        it('debería retornar array vacío si no hay productos', async () => {
            const res = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body.length).toBe(0)
        })
    })

    describe('PUT /api/products/:id', () => {
        it('debería actualizar producto propio', async () => {
            const product = await createTestProduct(testUser._id, {
                name: 'Original Name',
                price: 100,
                description: 'Original Desc'
            })

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated Name',
                    price: 150,
                    description: 'Updated Desc'
                })

            expect(res.statusCode).toBe(200)
            expect(res.body.name).toBe('Updated Name')
            expect(res.body.price).toBe(150)
            expect(res.body.description).toBe('Updated Desc')

            // Verificar en BD
            const updatedProduct = await Product.findById(product._id)
            expect(updatedProduct.name).toBe('Updated Name')
        })

        it('debería actualizar solo campos enviados', async () => {
            const product = await createTestProduct(testUser._id, {
                name: 'Partial Update',
                price: 100,
                description: 'Original'
            })

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    price: 200
                })

            expect(res.statusCode).toBe(200)
            expect(res.body.name).toBe('Partial Update')
            expect(res.body.price).toBe(200)
            expect(res.body.description).toBe('Original')
        })

        it('debería rechazar actualización de producto de otro usuario', async () => {
            const otherUser = await createTestUser('otheruser2')
            const product = await createTestProduct(otherUser._id, {
                name: 'Not My Product',
                price: 500
            })

            const res = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Hacked Name'
                })

            expect(res.statusCode).toBe(404)
        })

        it('debería retornar 404 si producto no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId()
            
            const res = await request(app)
                .put(`/api/products/${fakeId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Non-existent'
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

            // Verificar que fue eliminado
            const deletedProduct = await Product.findById(product._id)
            expect(deletedProduct).toBeNull()
        })

        it('debería rechazar eliminación de producto de otro usuario', async () => {
            const otherUser = await createTestUser('otheruser3')
            const product = await createTestProduct(otherUser._id)

            const res = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(404)

            // Verificar que el producto sigue existiendo
            const existingProduct = await Product.findById(product._id)
            expect(existingProduct).toBeTruthy()
        })

        it('debería retornar 404 si producto no existe', async () => {
            const fakeId = new mongoose.Types.ObjectId()
            
            const res = await request(app)
                .delete(`/api/products/${fakeId}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(res.statusCode).toBe(404)
        })
    })
})