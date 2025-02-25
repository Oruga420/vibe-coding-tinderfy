const express = require('express');
const {
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
  getConversations,
  getUnreadCount
} = require('../controllers/message');

// Middlewares
const { protect } = require('../middleware/auth');
const {
  sendMessageValidator,
  validateResults
} = require('../middleware/validators');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para conversaciones
router.get('/conversations', getConversations);
router.get('/unread', getUnreadCount);

// Rutas para mensajes
router.post('/', sendMessageValidator, validateResults, sendMessage);
router.get('/:matchId', getChatHistory);
router.put('/read/:matchId', markMessagesAsRead);

module.exports = router; 