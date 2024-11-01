const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    color: String,
    size: Number,
    customerContact: {
        name: String,
        email: String,
        phone: String,
    },
    status: {
        type: String,
        enum: ['in productie', 'verzonden'],
        default: 'in productie',
    },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
