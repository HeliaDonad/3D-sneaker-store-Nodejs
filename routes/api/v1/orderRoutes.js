const express = require('express');
const router = express.Router();
const Order = require('../../../models/api/v1/orderModel'); // Correct pad naar orderModel

// Testroute om een document toe te voegen en op te halen
router.get('/test-db', async (req, res) => {
  try {
    // Voeg een testdocument toe aan de Order-collectie
    const testOrder = new Order({
      color: 'blue',
      size: 42,
      contactInfo: {
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '123456789'
      },
      status: 'In productie'
    });

    // Sla de testorder op in de database
    await testOrder.save();

    // Haal alle orders op om te controleren of het document is toegevoegd
    const orders = await Order.find();
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
