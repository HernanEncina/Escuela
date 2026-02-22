const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

// Configuración CORS más permisiva para producción
app.use(cors({
    origin: '*', // Permite cualquier origen en producción
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.static(path.join(process.cwd(), 'public')))
// ... resto del código
// Middlewares
app.use(cors())
app.use(express.json())

// Servir archivos estáticos - CORREGIDO
app.use(express.static(path.join(__dirname, '../public')))


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