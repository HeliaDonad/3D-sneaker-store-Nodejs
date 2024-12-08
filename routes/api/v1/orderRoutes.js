const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel');
const { auth, adminAuth } = require('../../../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post(
  '/orders',
  auth,
  async (req, res) => {
    try {
      const newOrder = new Order({
        contactInfo: req.body.contactInfo,
        status: req.body.status || 'Pending',
        items: req.body.items || [],
      });

      await newOrder.save();

      if (req.io) {
        req.io.emit('newOrder', newOrder);
      }

      res.status(201).json({ status: 'success', data: newOrder });
    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save order',
        error: error.message,
      });
    }
  }
);

// 2. DELETE /orders/:id - Verwijder een bestelling (alleen admin)
router.delete('/orders/:id', auth, adminAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid order ID format' });
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    req.io.emit('orderDeleted', req.params.id);
    res.status(200).json({ status: 'success', message: 'Order deleted successfully' });
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

    req.io.emit('orderStatusUpdated', order);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

// 4. PATCH /orders/:id - Update de status van een order (alleen admin)
router.patch('/orders/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid status value' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    req.io.emit('orderStatusUpdated', order);
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
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch order', error: error.message });
  }
});

// 6. GET /orders - Haal alle bestellingen op
router.get('/orders', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.isAdmin) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    }
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders', error: error.message });
  }
});

module.exports = router;
