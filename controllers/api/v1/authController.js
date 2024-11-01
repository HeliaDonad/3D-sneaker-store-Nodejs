const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Helper functie om JWT token te genereren
const signToken = (id) => {
    return jwt.sign({ id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Controleer of username en password zijn meegegeven
    if (!username || !password) {
        return res.status(400).jsend.fail({ message: 'Geef een gebruikersnaam en wachtwoord op' });
    }

    // Vind gebruiker in database
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).jsend.fail({ message: 'Ongeldige inloggegevens' });
    }

    // Genereer JWT token
    const token = signToken(user._id);
    res.status(200).jsend.success({ token });
};

exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Haal de gebruiker op en controleer het oude wachtwoord
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
        return res.status(401).jsend.fail({ message: 'Oud wachtwoord is onjuist' });
    }

    // Update wachtwoord en sla op
    user.password = newPassword;
    await user.save();

    // Geef een nieuw token terug
    const token = signToken(user._id);
    res.status(200).jsend.success({ token });
};
