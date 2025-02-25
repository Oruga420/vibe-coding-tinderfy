const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    Obtener todas las notificaciones del usuario
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, read } = req.query;
  
  // Convertir parámetros a números
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  // Construir query
  const query = { recipient: userId };
  
  // Filtrar por estado de lectura si se especifica
  if (read !== undefined) {
    query.read = read === 'true';
  }
  
  // Obtener notificaciones con paginación
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  
  // Contar total de notificaciones para paginación
  const total = await Notification.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: notifications
  });
});

/**
 * @desc    Obtener conteo de notificaciones no leídas
 * @route   GET /api/notifications/unread/count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const count = await Notification.countDocuments({
    recipient: userId,
    read: false
  });
  
  res.status(200).json({
    success: true,
    data: {
      unreadCount: count
    }
  });
});

/**
 * @desc    Marcar notificaciones como leídas
 * @route   PUT /api/notifications/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.body;
  
  const query = { recipient: userId };
  
  // Si se especifica un ID, marcar solo esa notificación
  if (notificationId) {
    query._id = notificationId;
  }
  
  const result = await Notification.updateMany(query, { read: true });
  
  res.status(200).json({
    success: true,
    data: {
      modifiedCount: result.nModified || 0
    }
  });
});

/**
 * @desc    Eliminar una notificación
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  
  const result = await Notification.deleteOne({
    _id: notificationId,
    recipient: userId
  });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notificación no encontrada'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Actualizar preferencias de notificaciones
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    enablePush, 
    enableEmail, 
    matchNotifications, 
    messageNotifications, 
    likeNotifications 
  } = req.body;
  
  // Actualizar preferencias en el modelo de usuario
  const user = await User.findByIdAndUpdate(
    userId,
    {
      notificationPreferences: {
        enablePush: enablePush !== undefined ? enablePush : true,
        enableEmail: enableEmail !== undefined ? enableEmail : true,
        matchNotifications: matchNotifications !== undefined ? matchNotifications : true,
        messageNotifications: messageNotifications !== undefined ? messageNotifications : true,
        likeNotifications: likeNotifications !== undefined ? likeNotifications : true
      }
    },
    { new: true }
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }
  
  res.status(200).json({
    success: true,
    data: user.notificationPreferences
  });
});

/**
 * @desc    Registrar token FCM para notificaciones push
 * @route   PUT /api/notifications/token
 * @access  Private
 */
exports.registerPushToken = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fcmToken } = req.body;
  
  if (!fcmToken) {
    return res.status(400).json({
      success: false,
      error: 'Token FCM es requerido'
    });
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { fcmToken },
    { new: true }
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Token FCM registrado correctamente'
    }
  });
}); 