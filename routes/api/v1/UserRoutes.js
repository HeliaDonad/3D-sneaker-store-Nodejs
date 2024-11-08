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
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Inlogroute om een JWT-token te genereren
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Zoek de gebruiker op basis van e-mail
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Controleer het wachtwoord
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Genereer de JWT-token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ status: 'fail', data: { message: 'User not found' } });

    // Controleer of het oude wachtwoord klopt
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ status: 'fail', data: { message: 'Incorrect old password' } });

    // Update naar het nieuwe wachtwoord
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ status: 'success', data: { message: 'Password updated successfully' } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});


module.exports = router;