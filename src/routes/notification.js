const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  updateNotificationPreferences,
  registerPushToken
} = require('../controllers/notification');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para notificaciones
router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/read', markAsRead);
router.delete('/:id', deleteNotification);

// Rutas para preferencias de notificaciones
router.put('/preferences', updateNotificationPreferences);
router.put('/token', registerPushToken);

module.exports = router; 