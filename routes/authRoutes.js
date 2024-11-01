const express = require('express');
const { login, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.put('/updatePassword', protect, updatePassword);

module.exports = router;
