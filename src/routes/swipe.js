const express = require('express');
const router = express.Router();

// Importar controladores
const {
  getSwipeProfiles,
  swipeAction,
  getSwipeStats
} = require('../controllers/swipe');

// Importar middleware de autenticación y validación
const { protect } = require('../middleware/auth');
const { 
  swipeActionValidator, 
  swipeProfilesValidator,
  validateResults 
} = require('../middleware/validators');

// Ruta para obtener perfiles para swipe
router.get('/profiles', protect, swipeProfilesValidator, validateResults, getSwipeProfiles);

// Ruta para realizar acción de swipe (like/dislike)
router.post('/action', protect, swipeActionValidator, validateResults, swipeAction);

// Ruta para obtener estadísticas de swipe
router.get('/stats', protect, getSwipeStats);

module.exports = router; 