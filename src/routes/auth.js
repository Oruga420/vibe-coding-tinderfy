const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../middleware/validators');

const router = express.Router();

// Local authentication routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPasswordValidator, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidator, resetPassword);
router.get('/logout', protect, logout);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Create token
    const token = req.user.getSignedJwtToken();
    
    // Redirect to frontend with token
    res.redirect(`/oauth-success?token=${token}`);
  }
);

// Facebook OAuth routes
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Create token
    const token = req.user.getSignedJwtToken();
    
    // Redirect to frontend with token
    res.redirect(`/oauth-success?token=${token}`);
  }
);

module.exports = router; 