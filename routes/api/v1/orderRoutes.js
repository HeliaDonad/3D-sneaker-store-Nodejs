const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel'); // Controleer dat dit pad correct is
const { auth, adminAuth } = require('../../../middleware/auth'); // Zorg dat auth-middleware juist is geïmporteerd

// Testroute om een document toe te voegen en op te halen
router.get('/test-db', async (req, res) => {
  try {
    const testOrder = new Order({
      color: 'blue',
      size: 42,
      contactInfo: {
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '123456789'
      },
      status: 'In productie'
    });

    await testOrder.save();
    const orders = await Order.find();
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post('/orders', async (req, res) => {
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

// 2. DELETE /orders/:id - Verwijder een bestelling (alleen admin)
router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


// 3. PUT /orders/:id - Update de status van een bestelling (alleen admin)
// Update de status van een bestelling
router.put('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    // Zoek en update de bestelling
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true } // Hiermee retourneert Mongoose de bijgewerkte bestelling
    );

    // Controleer of de bestelling bestaat
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Stuur de bijgewerkte bestelling terug
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. GET /orders/:id - Haal details van een specifieke bestelling op
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. GET /orders - Haal alle bestellingen op met sorteeroptie
router.get('/orders', async (req, res) => {
  try {
    const sortBy = req.query.sortby === 'date' ? { createdAt: -1 } : {};
    const orders = await Order.find().sort(sortBy);
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
