const mongoose = require('mongoose');

// Item-schema voor elk product in de bestelling
const itemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Product' 
  },
  size: { type: Number, required: true, min: 36, max: 44 },
  color: { type: String, required: false }, // Optionele kleur
  quantity: { 
    type: Number, 
    required: true, 
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not a valid quantity. Must be an integer.'
    }
  }
});

// Hoofd-bestelschema
const orderSchema = new mongoose.Schema({
  items: { 
    type: [itemSchema], 
    required: true, 
    validate: {
      validator: function (items) {
        return items.length > 0;
      },
      message: 'An order must contain at least one item.'
    }
  },
  contactInfo: {
    name: { type: String, required: true, trim: true, minlength: 1 },
    email: { 
      type: String, 
      required: true, 
      match: /\S+@\S+\.\S+/,
      lowercase: true 
    },
    phone: { 
      type: String, 
      required: true, 
      match: /^[0-9]{10,15}$/ 
    }
  },
  status: {
    type: String,
    default: 'In productie', 
    enum: ['In productie', 'Verzonden', 'Geannuleerd'] 
  },
  totalAmount: {
    type: Number,
    required: false, 
    min: 0 
  }
}, { timestamps: true });

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
