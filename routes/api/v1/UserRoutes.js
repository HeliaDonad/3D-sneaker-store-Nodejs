const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../../models/api/v1/userModel'); // Controleer paden
const Order = require('../../../models/api/v1/orderModel'); // Controleer paden
const { auth } = require('../../../middleware/auth'); // Controleer paden

// Inlogroute
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Zoek de gebruiker in de database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Gebruiker niet gevonden' });
    }

    // Controleer of het wachtwoord klopt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Ongeldige inloggegevens' });
    }

    // Controleer of de gebruiker de admin is
    if (email === 'admin@admin.com' && user.isAdmin) {
      const token = jwt.sign(
        { userId: user._id, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.json({ status: 'success', data: { token } });
    } else {
      return res.status(403).json({ status: 'fail', message: 'Geen toegang' });
    }
  } catch (error) {
    console.error('Error bij inloggen:', error);
    res.status(500).json({ status: 'error', message: 'Serverfout bij inloggen', error: error.message });
  }
});

// Wachtwoord wijzigen
router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ status: 'fail', message: 'Oud en nieuw wachtwoord zijn verplicht' });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Gebruiker niet gevonden' });
    }

    // Controleer het oude wachtwoord
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Ongeldig oud wachtwoord' });
    }

    // Update naar het nieuwe wachtwoord
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ status: 'success', message: 'Wachtwoord succesvol bijgewerkt' });
  } catch (error) {
    console.error('Error bij wachtwoord wijzigen:', error);
    res.status(500).json({ status: 'error', message: 'Serverfout bij wachtwoord wijzigen', error: error.message });
  }
});

// Dashboard Route
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); // Excludeer het wachtwoord
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Gebruiker niet gevonden' });
    }

    const orders = await Order.find({ 'contactInfo.email': user.email });

    res.status(200).json({
      status: 'success',
      data: {
        user,
        orders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ status: 'error', message: 'Kon dashboardgegevens niet ophalen', error: error.message });
  }
});

module.exports = router;
