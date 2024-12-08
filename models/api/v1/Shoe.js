const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
  laces: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  inside: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  outside_1: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  outside_2: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  outside_3: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  sole_bottom: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
  sole_top: {
    color: { type: String },
    texture: { type: String },
    _id: false,
  },
});

const shoeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customization: customizationSchema,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shoe', shoeSchema);
