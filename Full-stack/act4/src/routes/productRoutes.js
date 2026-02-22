const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/authMiddleware')
const productController = require('../controllers/productController')

router.post('/', verifyToken, productController.createProduct)
router.get('/', verifyToken, productController.getProducts)
router.put('/:id', verifyToken, productController.updateProduct)
router.delete('/:id', verifyToken, productController.deleteProduct)

module.exports = router