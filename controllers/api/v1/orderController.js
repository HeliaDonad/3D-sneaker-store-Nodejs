const Order = require('../models/api/v1/orderModel');

exports.createOrder = async (req, res) => {
    const newOrder = await Order.create(req.body);
    res.status(201).jsend.success({ data: newOrder });
};

exports.deleteOrder = async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.status(204).jsend.success();
};

exports.updateOrderStatus = async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
    );
    res.status(200).jsend.success({ data: updatedOrder });
};

exports.getOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    res.status(200).jsend.success({ data: order });
};

exports.getAllOrders = async (req, res) => {
    const orders = await Order.find().sort(req.query.sortby);
    res.status(200).jsend.success({ data: orders });
};
