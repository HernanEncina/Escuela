const express = require('express')
const cors = require('cors')
const app = express()

// Middlewares
app.use(cors()) // Permite peticiones desde el frontend
app.use(express.json())
app.use(express.static('public')) // Sirve archivos estáticos

// Rutas
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

module.exports = app