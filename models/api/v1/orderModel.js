const mongoose = require('mongoose');

// Schema voor elk item in de bestelling
const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  size: { type: Number, required: true, min: 36, max: 44 }, // Schoenmaten van 36 tot 44
  quantity: { type: Number, required: true, min: 1 }, // Minimaal 1 item
  customization: {
    laces: {
      color: { type: String },
      texture: { type: String },
      _id: false, // Geen extra _id veld in subdocumenten
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

// Hoofd-schema voor de bestelling
const orderSchema = new mongoose.Schema(
  {
    items: { type: [itemSchema], required: true }, // Array van items in de bestelling
    contactInfo: {
      name: { type: String, required: true }, // Naam van de klant
      email: { type: String, required: true, match: /\S+@\S+\.\S+/ }, // Geldig e-mailadres
    },
    status: {
      type: String,
      enum: ['Pending', 'In productie', 'Verzonden', 'Geannuleerd'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
