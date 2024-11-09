const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel'); 
const { auth, adminAuth } = require('../../../middleware/auth');
const { check, validationResult } = require('express-validator');

// 1. POST /orders - Een nieuwe bestelling toevoegen met configuratiegegevens zoals kleur, maat en contactinformatie.
router.post('/orders', auth, [
  check('color').notEmpty().withMessage('Color is required'),
  check('size').isInt({ min: 30, max: 50 }).withMessage('Size must be a number between 30 and 50'),
  check('contactInfo.name').notEmpty().withMessage('Name is required'),
  check('contactInfo.email').isEmail().withMessage('Valid email is required'),
  check('contactInfo.phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', data: errors.array() });
  }

  try {
    const newOrder = new Order({
      color: req.body.color,
      size: req.body.size,
      contactInfo: {
        name: req.body.contactInfo.name,
        email: req.body.contactInfo.email,
        phone: req.body.contactInfo.phone,
      },
      status: req.body.status || 'In productie'
    });

    await newOrder.save();
    res.status(201).json({ status: 'success', data: newOrder });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// 2. DELETE /orders/:id - Verwijdert een bestelling, alleen toegankelijk voor admins.
router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    console.log("Ontvangen ID voor verwijdering:", req.params.id); 

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      console.log("Bestelling niet gevonden voor ID:", req.params.id);
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    console.log("Bestelling verwijderd:", req.params.id);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    console.error("Fout bij verwijderen:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});



// 3. PUT /orders/:id - Update de status van een bestelling, vb naar "In productie" of "Verzonden". Alleen toegankelijk voor admins.
router.put('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. GET /orders/:id - Haal details van een specifieke bestelling op
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// 5. GET /orders - Haal alle bestellingen op met sorteeroptie
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


module.exports = router;
