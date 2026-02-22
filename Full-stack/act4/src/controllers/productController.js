const Product = require('../models/Product')

exports.createProduct = async (req, res) => {
    try {
        const { name, price, description } = req.body

        const product = new Product({
            name,
            price,
            description,
            createdBy: req.user.id
        })

        await product.save()
        res.status(201).json(product)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({ createdBy: req.user.id })
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.id },
            req.body,
            { new: true }
        )

        if (!product) return res.sendStatus(404)

        res.json(product)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        })

        if (!product) return res.sendStatus(404)

        res.sendStatus(204)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}