const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../../../models/api/v1/userModel'); // Controleer paden
const Order = require('../../../models/api/v1/orderModel'); // Controleer paden
const { auth } = require('../../../middleware/auth'); // Controleer paden

// Registratieroute
router.post(
  '/register',
  [
    check('name').notEmpty().withMessage('Naam is verplicht'),
    check('email').isEmail().withMessage('Ongeldig e-mailadres'),
    check('password').isLength({ min: 5 }).withMessage('Wachtwoord moet minstens 5 tekens lang zijn'),
  ],
  async (req, res) => {
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        isAdmin: false, // Nieuwe gebruikers zijn standaard geen admin
      });

      await user.save();
      res.status(201).json({ status: 'success', message: 'Gebruiker succesvol geregistreerd' });
    } catch (error) {
      console.error('Error bij registratie:', error);
      res.status(500).json({ status: 'error', message: 'Serverfout bij registratie', error: error.message });
    }
  }
);
// Inlogroute
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Gebruiker niet gevonden' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Ongeldige inloggegevens' });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Bepaal de redirect URL op basis van de adminstatus
    res.json({ status: 'success', data: { token, isAdmin: user.isAdmin } });
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

    // Update het wachtwoord
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
    // Controleer of de gebruiker admin is
    if (!req.user.isAdmin) {
      return res.status(403).json({ status: 'fail', message: 'Toegang geweigerd' });
    }

    // Haal alle bestellingen op
    const orders = await Order.find();
    res.status(200).json({ status: 'success', data: { orders } });
  } catch (error) {
    console.error('Error bij dashboardgegevens ophalen:', error);
    res.status(500).json({ status: 'error', message: 'Kon dashboardgegevens niet ophalen', error: error.message });
  }
});


module.exports = router;
