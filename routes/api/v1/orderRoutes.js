const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel');
const { auth } = require('../../../middleware/auth'); // Import auth middleware
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post('/orders', auth, [
  check('contactInfo.name').notEmpty().withMessage('Name is required'),
  check('contactInfo.email').isEmail().withMessage('Valid email is required'),
  check('contactInfo.phone').matches(/^\+32\d{8,10}$/).withMessage('Phone must be in the format +32xxxxxxxx'),
  check('items').isArray().withMessage('Items must be an array of objects'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', data: errors.array() });
  }

  try {
    const newOrder = new Order({
      contactInfo: req.body.contactInfo,
      status: req.body.status || 'In productie',
      items: req.body.items || []  // Items komen uit het request body
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
  // Alleen admins kunnen bestellingen verwijderen
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
  // Alleen admins kunnen de status van een bestelling bijwerken
  if (!req.user.isAdmin) {
    return res.status(403).json({ status: 'fail', message: 'Access Denied: Admins Only' });
  }

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

// 6. GET /orders - Haal alle bestellingen op
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

// 7. POST /orders/:orderId/items - Add an item to an existing order (shopping bag)
router.post('/orders/:orderId/items', auth, async (req, res) => {
  const { size, quantity } = req.body;

  // Validate size and quantity
  if (size < 30 || size > 50) {
    return res.status(400).json({ status: 'fail', message: 'Size must be between 30 and 50' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ status: 'fail', message: 'Quantity must be greater than 0' });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Add the item to the order
    order.items.push({ size, quantity });
    await order.save();

    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add item to order', error: error.message });
  }
});

// 8. POST /orders/:orderId/checkout - Place the order (finalize it)
router.post('/orders/:orderId/checkout', auth, async (req, res) => {
  const orderId = req.params.orderId;  // The orderId comes from the URL parameter
  
  // Ensure that orderId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid order ID format' });
  }

  try {
    // Find the order using the valid ObjectId
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Update the status of the order to "Placed"
    order.status = 'Placed';
    await order.save();

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to place order', error: error.message });
  }
});


module.exports = router;