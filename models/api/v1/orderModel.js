const mongoose = require('mongoose');

// Define the item schema for each product in the order
const itemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Product' // Ensure you have a Product model
  },
  size: { 
    type: Number, 
    required: true, 
    min: 36, 
    max: 44 // Shoe size between 36 and 44
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not a valid quantity. Must be an integer.'
    } // Quantity must be an integer
  }
});

// Define the main order schema
const orderSchema = new mongoose.Schema({
  items: { 
    type: [itemSchema], 
    required: true, 
    validate: {
      validator: function (items) {
        return items.length > 0;
      },
      message: 'An order must contain at least one item.'
    } // Ensure the order has at least one item
  },
  contactInfo: {
    name: { 
      type: String, 
      required: true, 
      trim: true // Remove extra whitespace
    },
    email: { 
      type: String, 
      required: true, 
      match: /\S+@\S+\.\S+/,
      lowercase: true // Always store emails in lowercase
    },
    phone: { 
      type: String, 
      required: false, 
      match: /^[0-9]{10,15}$/ // Optional: Add phone number validation
    }
  },
  status: {
    type: String,
    default: 'In productie', // Default status for an order
    enum: ['In productie', 'Verzonden', 'Geannuleerd'] // Enum of valid statuses
  },
  totalAmount: {
    type: Number,
    required: false, // Optionally calculate total amount
    min: 0 // Amount must be positive
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
