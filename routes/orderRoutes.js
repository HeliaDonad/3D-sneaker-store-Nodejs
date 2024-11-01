const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createOrder,
    deleteOrder,
    updateOrderStatus,
    getOrder,
    getAllOrders
} = require('../controllers/api/v1/orderController');

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, restrictTo('admin'), getAllOrders);

router.route('/:id')
    .get(protect, getOrder)
    .delete(protect, restrictTo('admin'), deleteOrder)
    .patch(protect, restrictTo('admin'), updateOrderStatus);

module.exports = router;
