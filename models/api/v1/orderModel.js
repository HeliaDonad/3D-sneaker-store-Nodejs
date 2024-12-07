const mongoose = require('mongoose');

// Define the item schema for each product in the order
const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  size: { type: Number, required: true, min: 36, max: 44 },
  quantity: { type: Number, required: true, min: 1 },
  customization: {
    laces: {
      color: { type: String },
      texture: { type: String },
      _id: false, // Voorkom een extra _id veld in subdocumenten
      validate: {
        validator: function (value) {
          return value.color || value.texture; // Ten minste één moet aanwezig zijn
        },
        message: 'Either color or texture must be specified for laces.',
      },
    },
    inside: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for inside.',
      },
    },
    outside_1: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for outside_1.',
      },
    },
    outside_2: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for outside_2.',
      },
    },
    outside_3: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for outside_3.',
      },
    },
    sole_bottom: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for sole_bottom.',
      },
    },
    sole_top: {
      color: { type: String },
      texture: { type: String },
      _id: false,
      validate: {
        validator: function (value) {
          return value.color || value.texture;
        },
        message: 'Either color or texture must be specified for sole_top.',
      },
    },
  },
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
    enum: ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'],
    default: 'Pending',
  },  
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);