const Order = require('../../../models/api/v1/orderModel');
const mongoose = require('mongoose');

// 1. Maak een bestelling
const createOrder = async (req, res) => {
    try {
      const { contactInfo, items } = req.body;
  
      if (!contactInfo || !contactInfo.name || !contactInfo.email || !contactInfo.phone || !items || items.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Contactgegevens (naam, e-mail, telefoonnummer) en items zijn verplicht.',
        });
      }
  
      const newOrder = new Order({
        contactInfo,
        items,
        status: 'In productie',
      });
  
      const savedOrder = await newOrder.save();
  
      res.status(201).json({ status: 'success', data: savedOrder });
    } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Kon de bestelling niet aanmaken.',
        });
      }
    };
  

// 2. Verwijder een bestelling
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
    }

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    res.status(200).json({ status: 'success', message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete order', error: error.message });
  }
};

// 3. Update status van een bestelling
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['In productie', 'Verzonden', 'Geannuleerd'].includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status value' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update order status', error: error.message });
  }
};

// 4. Haal een specifieke bestelling op
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
    }

    const order = await Order.findById(id).populate('items.productId');
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch order', error: error.message });
  }
};

// 5. Haal alle bestellingen op
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders', error: error.message });
  }
};

// 6. Voeg een item toe aan een bestelling
const addItemToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { size, quantity } = req.body;

    if (!size || !quantity || quantity <= 0) {
      return res.status(400).json({ status: 'fail', message: 'Invalid size or quantity' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    order.items.push({ size, quantity });
    await order.save();

    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add item', error: error.message });
  }
};

// 7. Update een item in een bestelling
const updateOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { size, quantity } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ status: 'fail', message: 'Item not found' });
    }

    if (size) item.size = size;
    if (quantity) item.quantity = quantity;

    await order.save();

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update item', error: error.message });
  }
};

// 8. Finaliseer een bestelling
const checkoutOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    order.status = 'Verzonden';
    await order.save();

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to checkout order', error: error.message });
  }
};

module.exports = {
  createOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  addItemToOrder,
  updateOrderItem,
  checkoutOrder,
};
