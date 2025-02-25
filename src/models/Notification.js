const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['match', 'message', 'system', 'like'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Datos adicionales específicos del tipo de notificación
    // Por ejemplo, ID del match, ID del mensaje, etc.
    type: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 días en segundos (TTL index)
  }
});

// Índice para buscar notificaciones por usuario
NotificationSchema.index({ recipient: 1, createdAt: -1 });

// Índice para buscar notificaciones no leídas
NotificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema); 