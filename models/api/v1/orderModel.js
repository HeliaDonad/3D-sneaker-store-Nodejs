const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: Number, required: true },
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: { type: String, default: 'In productie' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
