const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        console.log('Intentando conectar a MongoDB...')
        console.log('URI:', process.env.MONGO_URI ? 'Definida' : 'NO DEFINIDA')
        
        // Versión simplificada - sin opciones obsoletas
        const conn = await mongoose.connect(process.env.MONGO_URI)
        
        console.log(`MongoDB Conectado: ${conn.connection.host}`)
        return conn
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message)
        throw error
    }
}

module.exports = connectDB