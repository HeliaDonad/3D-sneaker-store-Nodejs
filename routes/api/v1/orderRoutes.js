const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../../../middleware/auth');
const {
  createOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  addItemToOrder,
  updateOrderItem,
  checkoutOrder,
} = require('../../../controllers/api/v1/orderControllers');

// Routes
router.post('/orders', auth, createOrder); // Maak een bestelling
router.delete('/orders/:id', auth, adminAuth, deleteOrder); // Verwijder een bestelling
router.put('/orders/:id', auth, adminAuth, updateOrderStatus); // Update status
router.get('/orders/:id', auth, getOrderById); // Haal een specifieke bestelling op
router.get('/orders', auth, getAllOrders); // Haal alle bestellingen op
router.post('/orders/:orderId/items', auth, addItemToOrder); // Voeg een item toe
router.patch('/orders/:orderId/items/:itemId', auth, updateOrderItem); // Update een item
router.post('/orders/:orderId/checkout', auth, checkoutOrder); // Finaliseer een bestelling

module.exports = router;
