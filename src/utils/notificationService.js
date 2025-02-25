const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Servicio para gestionar notificaciones
 */
class NotificationService {
  constructor(io) {
    this.io = io; // Instancia de Socket.IO
  }

  /**
   * Crear y enviar una notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object>} - La notificación creada
   */
  async createNotification(notificationData) {
    try {
      // Crear la notificación en la base de datos
      const notification = await Notification.create(notificationData);

      // Enviar la notificación en tiempo real si el usuario está conectado
      this.sendRealTimeNotification(notification);

      // Preparar para envío de notificación push si el usuario tiene token FCM
      await this.preparePushNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación en tiempo real a través de Socket.IO
   * @param {Object} notification - La notificación a enviar
   */
  sendRealTimeNotification(notification) {
    if (this.io) {
      // Emitir al usuario específico usando su ID como sala
      this.io.to(notification.recipient.toString()).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt
      });
    }
  }

  /**
   * Preparar notificación push (para implementación futura con FCM)
   * @param {Object} notification - La notificación a enviar
   */
  async preparePushNotification(notification) {
    try {
      // Buscar si el usuario tiene token FCM registrado
      const user = await User.findById(notification.recipient);
      
      if (user && user.fcmToken) {
        // Aquí se implementaría la lógica para enviar a FCM
        // Por ahora solo lo registramos en el log
        console.log(`[FCM] Notificación preparada para envío a ${user.name}`);
      }
    } catch (error) {
      console.error('Error al preparar notificación push:', error);
    }
  }

  /**
   * Obtener notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de paginación y filtrado
   * @returns {Promise<Array>} - Lista de notificaciones
   */
  async getUserNotifications(userId, options = {}) {
    const { limit = 20, page = 1, read } = options;
    const skip = (page - 1) * limit;

    const query = { recipient: userId };
    
    // Filtrar por estado de lectura si se especifica
    if (read !== undefined) {
      query.read = read;
    }

    try {
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  /**
   * Marcar notificaciones como leídas
   * @param {string} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación (opcional, si no se especifica se marcan todas)
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async markAsRead(userId, notificationId = null) {
    try {
      const query = { recipient: userId };
      
      // Si se especifica un ID, marcar solo esa notificación
      if (notificationId) {
        query._id = notificationId;
      }

      const result = await Notification.updateMany(query, { read: true });
      
      return {
        success: true,
        modifiedCount: result.nModified || 0
      };
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Contar notificaciones no leídas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} - Número de notificaciones no leídas
   */
  async countUnreadNotifications(userId) {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        read: false
      });
      
      return count;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar una notificación
   * @param {string} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async deleteNotification(userId, notificationId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipient: userId
      });
      
      return {
        success: true,
        deleted: result.deletedCount > 0
      };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de nuevo match
   * @param {string} userId - ID del usuario que recibe la notificación
   * @param {Object} matchData - Datos del match
   * @returns {Promise<Object>} - La notificación creada
   */
  async createMatchNotification(userId, matchData) {
    const { matchId, userName, userPhoto } = matchData;
    
    return this.createNotification({
      recipient: userId,
      type: 'match',
      title: '¡Nuevo Match!',
      message: `Has hecho match con ${userName}`,
      data: {
        matchId,
        userName,
        userPhoto
      }
    });
  }

  /**
   * Crear notificación de nuevo mensaje
   * @param {string} userId - ID del usuario que recibe la notificación
   * @param {Object} messageData - Datos del mensaje
   * @returns {Promise<Object>} - La notificación creada
   */
  async createMessageNotification(userId, messageData) {
    const { matchId, senderId, senderName, messageContent } = messageData;
    
    return this.createNotification({
      recipient: userId,
      type: 'message',
      title: 'Nuevo mensaje',
      message: `${senderName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
      data: {
        matchId,
        senderId,
        senderName
      }
    });
  }

  /**
   * Crear notificación de like recibido
   * @param {string} userId - ID del usuario que recibe la notificación
   * @param {Object} likeData - Datos del like
   * @returns {Promise<Object>} - La notificación creada
   */
  async createLikeNotification(userId, likeData) {
    const { likerName } = likeData;
    
    return this.createNotification({
      recipient: userId,
      type: 'like',
      title: 'Nuevo Like',
      message: `A ${likerName} le gustó tu perfil`,
      data: likeData
    });
  }
}

module.exports = NotificationService; 