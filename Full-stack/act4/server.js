require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')

// Conectar a MongoDB solo si NO estamos en Vercel
if (!process.env.VERCEL) {
  connectDB().then(() => {
    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  })
}

// ¡ESTO ES CRÍTICO PARA VERCEL!
module.exports = app