const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel');
const { auth } = require('../../../middleware/auth'); // Middleware for authentication
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post('/orders', auth, [
  check('contactInfo.name').notEmpty().withMessage('Name is required'),
  check('contactInfo.email').isEmail().withMessage('Valid email is required'),
  check('items').isArray().withMessage('Items must be an array of objects')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', data: errors.array() });
  }

  try {
    const newOrder = new Order({
      userId: req.user.userId, // Koppel de bestelling aan de ingelogde gebruiker
      contactInfo: req.body.contactInfo,
      status: req.body.status || 'In productie',
      items: req.body.items || []  // Items komen uit de request body
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
router.delete('/orders/:id', auth, async (req, res) => {
  // Alleen admins mogen bestellingen verwijderen
  if (!req.user.isAdmin) {
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
  }

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
router.put('/orders/:id', auth, async (req, res) => {
  // Alleen admins mogen de status van een bestelling bijwerken
  if (!req.user.isAdmin) {
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
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

// 4. PATCH /orders/:orderId/items/:itemId - Update an item in the shopping bag (order)
router.patch('/orders/:orderId/items/:itemId', auth, async (req, res) => {
  const { size, quantity } = req.body;

  // Validate the fields being updated
  const errors = [];
  if (size && (typeof size !== 'number' || size < 30 || size > 50)) {
    errors.push('Size must be a number between 30 and 50');
  }
  if (quantity && (typeof quantity !== 'number' || quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  if (errors.length > 0) {
    return res.status(400).json({ status: 'fail', data: errors });
  }

  try {
    // Find the order by ID
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Find the item in the order's items array
    const itemIndex = order.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: 'fail', message: 'Item not found in order' });
    }

    // Update the item with new values
    const item = order.items[itemIndex];
    if (size) item.size = size;
    if (quantity) item.quantity = quantity;

    // Save the updated order
    await order.save();
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order item', error: error.message });
  }
});

// 5. GET /orders/:id - Haal een specifieke bestelling op
router.get('/orders/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
  }

  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email'); // Voeg gebruikersinfo toe
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

// 6. GET /orders - Haal alle bestellingen op
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email') // Voeg gebruikersinfo toe
      .sort({ createdAt: -1 });

    console.log('All orders fetched:', orders.length); // Debug logging
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders', error: error.message });
  }
});

// 7. GET /orders/user - Haal bestellingen op voor de ingelogde gebruiker
router.get('/orders/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error fetching user orders:', error); // Debug logging
    res.status(500).json({ status: 'error', message: 'Failed to fetch user orders', error: error.message });
  }
});

module.exports = router;
