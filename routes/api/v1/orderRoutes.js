const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel');
const { auth, adminAuth } = require('../../../middleware/auth'); // Import auth middleware
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. POST /orders - Voeg een nieuwe bestelling toe
router.post(
  '/orders',
  auth, // Controleer of de gebruiker is geauthenticeerd
  async (req, res) => {
    try {
      const newOrder = new Order({
        contactInfo: req.body.contactInfo,
        status: req.body.status || 'Pending',
        items: req.body.items || [],
      });

      await newOrder.save();

      // Controleer of `req.io` bestaat voordat je `emit` aanroept
      if (req.io) {
        req.io.emit('newOrder', newOrder); // Emit live update voor nieuwe orders
      } else {
        console.error('Socket.IO instance is not available in req');
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

    req.io.emit('orderDeleted', req.params.id); // Informeer clients via WebSocket
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

    req.io.emit('orderStatusUpdated', order); // Emit live update voor statuswijziging
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

router.options('/orders/:id', cors()); // Zorg dat OPTIONS-verzoeken werken

// PATCH /orders/:id - Update the status of an order (only admin)
router.patch('/orders/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;

  // Validate status
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

    req.io.emit('orderStatusUpdated', order); // Emit live update
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update order', error: error.message });
  }
});

// PATCH /orders/:orderId/items/:itemId - Update an item in a specific order
router.patch('/orders/:orderId/items/:itemId', auth, async (req, res) => {
  const { size, quantity } = req.body;

  // Validate size and quantity
  const errors = [];
  if (size && (typeof size !== 'string')) {
    errors.push('Size must be a valid string');
  }
  if (quantity && (typeof quantity !== 'number' || quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  if (errors.length > 0) {
    return res.status(400).json({ status: 'fail', data: errors });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    const itemIndex = order.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: 'fail', message: 'Item not found in order' });
    }

    const item = order.items[itemIndex];
    if (size) item.size = size;
    if (quantity) item.quantity = quantity;

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

    if (req.query.all && req.user.isAdmin) {
      // Admin kan alle orders ophalen als 'all' is gespecificeerd
      orders = await Order.find().sort({ createdAt: -1 });
    } else if (req.query.all) {
      // Niet-admin gebruikers kunnen optioneel alle orders zien
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      // Standaard: gebruikers zien alleen hun eigen orders
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