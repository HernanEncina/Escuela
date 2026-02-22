const express = require('express')
const cors = require('cors')
const path = require('path')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const app = express()

// CORS
app.use(cors({
    origin: '*', // Temporalmente abierto para pruebas
    credentials: true
}))

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Middleware simplificado para MongoDB
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        try {
            const state = mongoose.connection.readyState
            console.log('MongoDB state:', state)
            
            if (state === 0) {
                console.log('Conectando a MongoDB...')
                await connectDB()
            }
        } catch (error) {
            console.error('Error DB:', error)
            return res.status(500).json({ 
                error: 'Database connection error',
                message: error.message 
            })
        }
    }
    next()
})

// Import routes
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'))
})

// Health check simplificado
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        time: new Date().toISOString()
    })
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path })
})

module.exports = app