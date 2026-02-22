require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')

// Conectar a MongoDB solo si NO estamos en Vercel o si es necesario
if (!process.env.VERCEL) {
    // En desarrollo local
    connectDB().then(() => {
        const port = process.env.PORT || 3000
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    })
} else {
    // En Vercel, la conexión se hará bajo demanda
    console.log('Running on Vercel, MongoDB connection will be established on demand')
}

// Para Vercel, necesitamos asegurar que la conexión existe antes de cada request
// Esto se maneja en un middleware en app.js

module.exports = app