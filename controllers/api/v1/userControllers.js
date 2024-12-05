const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../../../models/api/v1/userModel');
const Order = require('../../../models/api/v1/orderModel');

// Gebruiker registreren
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'E-mailadres is al in gebruik' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
    });

    await user.save();
    res.status(201).json({ status: 'success', message: 'Gebruiker succesvol geregistreerd' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij registratie', error: error.message });
  }
};

// Gebruiker inloggen
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'E-mailadres niet gevonden' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Ongeldig wachtwoord' });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({ status: 'success', data: { token, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij inloggen', error: error.message });
  }
};

// Wachtwoord wijzigen
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || newPassword.length < 5) {
    return res.status(400).json({ status: 'fail', message: 'Invalid password input' });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Gebruiker niet gevonden' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Ongeldig oud wachtwoord' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ status: 'success', message: 'Wachtwoord succesvol gewijzigd' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij wachtwoord wijzigen', error: error.message });
  }
};

// Dashboard ophalen
const getDashboard = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ status: 'fail', message: 'Toegang geweigerd' });
    }

    const orders = await Order.find();
    res.status(200).json({ status: 'success', data: { orders } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij ophalen van dashboardgegevens', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  getDashboard,
};
