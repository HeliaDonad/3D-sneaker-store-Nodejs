// routes/api/v1/productRoutes.js
const express = require('express');
const router = express.Router();

// Mock product data
const products = [
  { productId: '60d5ec49f1b2c12a4c8e4d5a', name: 'Sneaker Model 1'},
];

// GET /api/v1/products
router.get('/products', (req, res) => {
  res.status(200).json({ status: 'success', data: products });
});

module.exports = router;
