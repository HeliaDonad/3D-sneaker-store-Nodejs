const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../../../middleware/auth');

// Controllers importeren
const {
  registerUser,
  loginUser,
  changePassword,
  getDashboard,
} = require('../../../controllers/api/v1/userControllers');

// Registratieroute
router.post(
  '/register',
  [
    check('name').notEmpty().withMessage('Naam is verplicht'),
    check('email').isEmail().withMessage('Ongeldig e-mailadres'),
    check('password').isLength({ min: 5 }).withMessage('Wachtwoord moet minstens 5 tekens lang zijn'),
  ],
  registerUser
);

// Inlogroute
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Ongeldig e-mailadres'),
    check('password').notEmpty().withMessage('Wachtwoord is verplicht'),
  ],
  loginUser
);

// Wachtwoord wijzigen
router.put(
  '/change-password',
  auth,
  [
    check('oldPassword').notEmpty().withMessage('Oud wachtwoord is verplicht'),
    check('newPassword').isLength({ min: 5 }).withMessage('Nieuw wachtwoord moet minstens 5 tekens lang zijn'),
  ],
  changePassword
);

// Dashboard Route (alleen admin)
router.get('/dashboard', auth, getDashboard);

module.exports = router;
