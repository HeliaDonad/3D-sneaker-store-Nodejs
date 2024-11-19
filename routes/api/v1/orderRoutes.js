const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel'); 
const { auth, adminAuth } = require('../../../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 1. POST /orders - Voeg een nieuwe bestelling toe
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
      contactInfo: req.body.contactInfo,
      status: req.body.status || 'In productie',
    });

    console.log('Saving new order:', newOrder); // Debug logging

    await newOrder.save();
    res.status(201).json({ status: 'success', data: newOrder });
  } catch (error) {
    console.error('Error saving order:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to save order', error: error.message });
  }
});

// 2. DELETE /orders/:id - Verwijder een bestelling
router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    console.log('Order deleted:', order); // Debug logging

    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    console.error('Error deleting order:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to delete order', error: error.message });
  }
});

// 3. PUT /orders/:id - Update de status van een bestelling
router.put('/orders/:id', auth, adminAuth, [
  check('status').isIn(['In productie', 'Verzonden', 'Geannuleerd']).withMessage('Invalid status value'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', data: errors.array() });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    console.log('Order updated:', order); // Debug logging

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

// 4. GET /orders/:id - Haal een specifieke bestelling op
router.get('/orders/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    console.log('Order fetched:', order); // Debug logging

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error fetching order:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to fetch order', error: error.message });
  }
});

// 5. GET /orders - Haal alle bestellingen op
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    console.log('All orders fetched:', orders.length); // Debug logging

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders', error: error.message });
  }
});

module.exports = router;
