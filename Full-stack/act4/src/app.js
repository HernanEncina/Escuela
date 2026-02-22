const express = require('express')
const cors = require('cors')
const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Import routes
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')

// Registrar rutas
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

// Ruta raíz para testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      products: '/api/products/*'
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    time: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

module.exports = app