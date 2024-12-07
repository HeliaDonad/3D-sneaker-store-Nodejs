const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel');
const { auth } = require('../../../middleware/auth'); // Import auth middleware
const { adminAuth } = require('../../../middleware/adminAuth'); // Middleware voor admincontrole
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post(
  '/orders',
  auth,
  [
    check('contactInfo.name').notEmpty().withMessage('Name is required'),
    check('contactInfo.email').isEmail().withMessage('Valid email is required'),
    check('items').isArray().withMessage('Items must be an array of objects'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', data: errors.array() });
    }

    try {
      const newOrder = new Order({
        contactInfo: req.body.contactInfo,
        status: req.body.status || 'Pending',
        items: req.body.items || [],
      });

      await newOrder.save();
      req.io.emit('newOrder', newOrder); // Emit live update voor nieuwe orders
      res.status(201).json({ status: 'success', data: newOrder });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ status: 'error', message: 'Failed to save order', error: error.message });
    }
  }
);

// 2. DELETE /orders/:id - Verwijder een bestelling (alleen admin)
router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    req.io.emit('orderDeleted', order._id); // Emit live update voor verwijdering
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete order', error: error.message });
  }
});

// 3. PUT /orders/:id - Update de status van een bestelling (alleen admin)
router.put('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    req.io.emit('orderStatusUpdated', order); // Emit live update voor statuswijziging
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

// PATCH /orders/:id - Update the status of an order (only admin)
router.patch('/orders/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;

  // Validate status
  const allowedStatuses = ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid status value' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    if (status) order.status = status; // Update status if provided
    await order.save();
    req.io.emit('orderStatusUpdated', { orderId: order._id, newStatus: order.status });

    req.io.emit('orderStatusUpdated', order); // Emit live update
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

// PATCH /orders/:orderId/items/:itemId - Update an item in a specific order
router.patch('/orders/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;

  // Validate status
  const allowedStatuses = ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid status value' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    if (status) order.status = status; // Update status if provided
    await order.save();

    // Emit live update
    req.io.emit('orderStatusUpdated', { orderId: order._id, newStatus: order.status });

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
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

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order', error: error.message });
  }
});

// 6. GET /orders - Haal alle bestellingen op (admin alle, gebruiker alleen eigen orders)
router.get('/orders', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.isAdmin) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ 'contactInfo.email': req.user.email }).sort({ createdAt: -1 });
    }

    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
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