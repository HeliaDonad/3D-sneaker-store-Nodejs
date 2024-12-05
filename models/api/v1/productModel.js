//  eigenschappen vann het model
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true // Verwijder extra spaties
  },
  price: { 
    type: Number, 
    required: true, 
    min: 1 // Prijs moet positief zijn
  }
}, { timestamps: true }); // Maakt `createdAt` en `updatedAt` velden aan

module.exports = mongoose.model('Product', productSchema);
