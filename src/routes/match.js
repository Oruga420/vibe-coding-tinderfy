const express = require('express');
const router = express.Router();

// Importar controladores
const {
  generateMatches,
  getMatches,
  getMatch,
  updateMatchStatus,
  getMatchStats,
  getMusicRecommendations
} = require('../controllers/match');

// Importar middleware de autenticación
const { protect } = require('../middleware/auth');

// Rutas para estadísticas y recomendaciones
router.get('/stats', protect, getMatchStats);
router.get('/recommendations', protect, getMusicRecommendations);

// Ruta para generar matches
router.get('/generate', protect, generateMatches);

// Rutas básicas de matches
router.route('/')
  .get(protect, getMatches);

// Rutas para un match específico
router.route('/:id')
  .get(protect, getMatch);

// Ruta para actualizar estado de match
router.route('/:id/status')
  .put(protect, updateMatchStatus);

module.exports = router; 