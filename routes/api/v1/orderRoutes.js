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

// Routes voor bestellingen
router.post('/', createOrder); // POST /api/v1/orders
router.delete('/:id', auth, adminAuth, deleteOrder); // DELETE /api/v1/orders/:id
router.put('/:id', auth, adminAuth, updateOrderStatus); // PUT /api/v1/orders/:id
router.get('/:id', auth, getOrderById); // GET /api/v1/orders/:id
router.get('/', auth, getAllOrders); // GET /api/v1/orders
router.post('/:orderId/items', auth, addItemToOrder); // POST /api/v1/orders/:orderId/items
router.patch('/:orderId/items/:itemId', auth, updateOrderItem); // PATCH /api/v1/orders/:orderId/items/:itemId
router.post('/:orderId/checkout', auth, checkoutOrder); // POST /api/v1/orders/:orderId/checkout

module.exports = router;
