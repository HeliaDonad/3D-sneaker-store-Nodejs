const express = require('express');
const router = express.Router();
const Product = require('../../../models/api/v1/productModel');

// Route om een nieuw product toe te voegen
router.post('/', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ status: 'fail', message: 'Naam en prijs zijn verplicht.' });
    }
    const newProduct = new Product({ name, price });
    await newProduct.save();
    res.status(201).json({ status: 'success', data: newProduct });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Fout bij het toevoegen van product', error: error.message });
  }
});

// Route om alle producten op te halen
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Fout bij het ophalen van producten', error: error.message });
  }
});

module.exports = router;
