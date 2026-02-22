const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'

let mongoServer

// Configurar variables de entorno para tests
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
process.env.NODE_ENV = 'test'

// Conectar a base de datos en memoria antes de todos los tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
})

// Desconectar y cerrar después de todos los tests
afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

// Limpiar colecciones después de cada test
afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany()
    }
})

// Helper para crear tokens de prueba
const generateTestTokens = (userId, username) => {
    const payload = { id: userId, username }
    
    const accessToken = jwt.sign(
        payload, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: '30s' }
    )
    
    const refreshToken = jwt.sign(
        payload, 
        process.env.REFRESH_TOKEN_SECRET
    )
    
    return { accessToken, refreshToken }
}

// Helper para crear usuario de prueba
const createTestUser = async (username = 'testuser', password = 'password123') => {
    const User = require('../../models/User')
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
        username,
        password: hashedPassword,
        refreshTokens: []
    })
    
    await user.save()
    return user
}

// Helper para crear producto de prueba
const createTestProduct = async (userId, productData = {}) => {
    const Product = require('../../models/Product')
    
    const product = new Product({
        name: productData.name || 'Test Product',
        price: productData.price || 99.99,
        description: productData.description || 'Test Description',
        createdBy: userId
    })
    
    await product.save()
    return product
}

module.exports = {
    generateTestTokens,
    createTestUser,
    createTestProduct
}