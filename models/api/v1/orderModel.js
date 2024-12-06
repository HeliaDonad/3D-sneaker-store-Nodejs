const mongoose = require('mongoose');

// Item-schema voor elk product in de bestelling
// Item schema
const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

// Hoofd-bestelschema
const orderSchema = new mongoose.Schema(
  {
    contactInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: false },
    },
    items: { type: [itemSchema], required: true },
    status: {
      type: String,
      default: 'In productie',
      enum: ['In productie', 'Verzonden', 'Geannuleerd'],
    },
  },
  { timestamps: true }
);
// Bereken automatisch het totaalbedrag
orderSchema.pre('save', async function (next) {
  if (this.isModified('items')) {
    const productIds = this.items.map(item => item.productId);
    const products = await mongoose.model('Product').find({ _id: { $in: productIds } });

    let total = 0;
    this.items.forEach(item => {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (product) {
        total += product.price * item.quantity;
      }
    });

    this.totalAmount = total;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);