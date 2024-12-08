const express = require('express');
const router = express.Router();
const Shoe = require('../models/Shoe');

// Route voor het opslaan van customization
router.post('/customize', async (req, res) => {
  const { name, customization } = req.body;

  if (!name || !customization) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name and customization data are required.',
    });
  }

  try {
    const newShoe = await Shoe.create({ name, customization });
    res.status(201).json({ status: 'success', data: newShoe });
  } catch (error) {
    console.error('Error saving customization:', error.message);
    res.status(500).json({ status: 'fail', error: error.message });
  }
});

// Route voor het ophalen van customization
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const shoe = await Shoe.findById(id);
    if (!shoe) {
      return res.status(404).json({ status: 'fail', message: 'Shoe not found.' });
    }
    res.status(200).json({ status: 'success', data: shoe });
  } catch (error) {
    console.error('Error fetching customization:', error.message);
    res.status(500).json({ status: 'fail', error: error.message });
  }
});

module.exports = router;
