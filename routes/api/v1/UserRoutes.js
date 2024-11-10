const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../../models/api/v1/userModel'); // Zorg ervoor dat dit pad klopt
const { auth } = require('../../../middleware/auth'); // Zorg dat het pad naar auth correct is


// Registratieroute om een nieuwe gebruiker toe te voegen
router.post('/register', async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  try {
    // Controleer of het e-mailadres al bestaat
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'E-mailadres is al in gebruik'
      });
    }

    // Hash het wachtwoord en maak een nieuwe gebruiker aan
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    await user.save();
    res.status(201).json({ status: 'success', message: 'Gebruiker succesvol geregistreerd' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij registratie', error: error.message });
  }
});

// Inlogroute om een JWT-token te genereren
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Zoek de gebruiker op basis van e-mail
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ status: 'fail', message: 'Gebruiker niet gevonden' });

    // Controleer het wachtwoord
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ status: 'fail', message: 'Ongeldige inloggegevens' });

    // Genereer de JWT-token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ status: 'success', data: { token } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij inloggen', error: error.message });
  }
});

// Route om het wachtwoord te wijzigen
router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ status: 'fail', message: 'Gebruiker niet gevonden' });

    // Controleer of het oude wachtwoord klopt
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ status: 'fail', message: 'Ongeldig oud wachtwoord' });

    // Update naar het nieuwe wachtwoord
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ status: 'success', message: 'Wachtwoord succesvol bijgewerkt' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Serverfout bij wachtwoord wijzigen', error: error.message });
  }
});

module.exports = router;
