const Order = require('../../../models/api/v1/orderModel');

const mongoose = require('mongoose');

// 1. Maak een bestelling
const createOrder = async (req, res) => {
    try {
      // Log de ontvangen request body
      console.log('Request body ontvangen in backend:', req.body);
  
      const { contactInfo, items } = req.body;
  
      // Controleer of de benodigde velden aanwezig zijn
      if (!contactInfo || !contactInfo.name || !contactInfo.email || !items || items.length === 0) {
        console.log('Ongeldige data ontvangen:', { contactInfo, items }); // Log de foutieve data
        return res.status(400).json({
          status: 'fail',
          message: 'Contactgegevens (naam, e-mail, telefoonnummer) en items zijn verplicht.',
        });
      }
  
      // Log voor debugging
      console.log('Contactgegevens:', contactInfo);
      console.log('Items:', items);
  
      const newOrder = new Order({
        contactInfo,
        items: items.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),  
        status: 'In productie',
      });
  
      const savedOrder = await newOrder.save();
  
      // Log de opgeslagen bestelling
      console.log('Bestelling succesvol aangemaakt:', savedOrder);
  
      res.status(201).json({ status: 'success', data: savedOrder });
    } catch (error) {
      console.error('Fout bij aanmaken bestelling:', error.message);
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
    const { id } = req.params; // Haal order ID uit de URL
    const { status } = req.body; // Haal de nieuwe status uit de body

    // Controleer of de status een toegestane waarde is
    const allowedStatuses = ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid status value' });
    }

    // Zoek de order en update de status
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Emit live update via Socket.IO
    req.io.emit('orderStatusUpdated', order);

    res.status(200).json({ status: 'success', data: order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ status: 'fail', message: 'Server error' });
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
    const { orderId, itemId } = req.params; // Haal order- en item-ID's uit de URL
    const { size, quantity } = req.body; // Haal size en quantity uit de body

    // Zoek de bestelling
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found' });
    }

    // Zoek het item in de bestelling
    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ status: 'fail', message: 'Item not found' });
    }

    // Update de itemwaarden indien aanwezig
    if (size) {
      if (typeof size !== 'number' || size < 30 || size > 50) {
        return res.status(400).json({ status: 'fail', message: 'Size must be a number between 30 and 50' });
      }
      item.size = size;
    }

    if (quantity) {
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ status: 'fail', message: 'Quantity must be a positive number' });
      }
      item.quantity = quantity;
    }

    // Sla de bestelling op
    await order.save();

    // Emit live update via Socket.IO
    req.io.emit('orderItemUpdated', order);

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Error updating order item:', error);
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
