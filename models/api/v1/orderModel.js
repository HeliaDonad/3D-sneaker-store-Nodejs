const mongoose = require('mongoose');

// Define the item schema for each product in the order
const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  size: { type: Number, required: true, min: 36, max: 44 }, // Shoe size between 36 and 44
  quantity: { type: Number, required: true, min: 1 } // Minimum quantity is 1
});

// Define the main order schema
const orderSchema = new mongoose.Schema({
  items: { type: [itemSchema], required: true }, // Array of items in the order
  contactInfo: {
    name: { type: String, required: true }, // Name of the person placing the order
    email: { type: String, required: true, match: /\S+@\S+\.\S+/ } // Email must be valid
  },
  status: {
    type: String,
    default: 'In productie', // Default status for an order
    enum: ['In productie', 'Verzonden', 'Geannuleerd'] // Enum of valid statuses
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
