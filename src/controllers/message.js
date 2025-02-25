const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Enviar un mensaje a otro usuario
 * @route   POST /api/messages
 * @access  Private
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { matchId, content, attachments } = req.body;
  const senderId = req.user.id;

  // Verificar que el match existe y el usuario es parte de él
  const match = await Match.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match no encontrado'
    });
  }

  // Verificar que es un match confirmado (ambos aceptaron)
  if (!match.isMatch) {
    return res.status(400).json({
      success: false,
      error: 'No puedes enviar mensajes a un usuario que no es un match confirmado'
    });
  }

  // Determinar quién es el receptor
  const receiverId = match.userA.toString() === senderId 
    ? match.userB.toString() 
    : match.userA.toString();

  // Crear el mensaje
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    match: matchId,
    content,
    attachments: attachments || []
  });

  // Poblar los datos del remitente para la respuesta
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');

  // Emitir evento de nuevo mensaje si hay sockets configurados
  if (req.app.get('io')) {
    const io = req.app.get('io');
    
    // Emitir a la sala del receptor
    io.to(receiverId).emit('newMessage', {
      message: populatedMessage
    });
    
    // También emitir a la sala del match
    io.to(`match_${matchId}`).emit('newMessage', {
      message: populatedMessage
    });
  }

  // Enviar notificación al receptor
  const sender = await User.findById(senderId, 'name');
  const receiver = await User.findById(receiverId);
  
  // Verificar preferencias de notificaciones del receptor
  if (receiver.notificationPreferences?.messageNotifications !== false) {
    // Obtener el servicio de notificaciones
    const notificationService = req.app.get('notificationService');
    
    if (notificationService) {
      await notificationService.createMessageNotification(receiverId, {
        matchId,
        senderId,
        senderName: sender.name,
        messageContent: content
      });
    }
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

/**
 * @desc    Obtener historial de chat con un match
 * @route   GET /api/messages/:matchId
 * @access  Private
 */
exports.getChatHistory = asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  const userId = req.user.id;
  
  // Opcionalmente limitar el número de mensajes o paginar
  const limit = parseInt(req.query.limit) || 50;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  // Verificar que el match existe y el usuario es parte de él
  const match = await Match.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match no encontrado'
    });
  }

  // Verificar que el usuario es parte del match
  if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'No tienes permiso para ver estos mensajes'
    });
  }

  // Obtener los mensajes
  const messages = await Message.find({ match: matchId })
    .sort({ createdAt: -1 }) // Más recientes primero
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');

  // Contar total de mensajes para paginación
  const total = await Message.countDocuments({ match: matchId });

  res.status(200).json({
    success: true,
    count: messages.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    data: messages.reverse() // Invertir para ordenar cronológicamente (más antiguos primero)
  });
});

/**
 * @desc    Marcar mensajes como leídos
 * @route   PUT /api/messages/read/:matchId
 * @access  Private
 */
exports.markMessagesAsRead = asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  const userId = req.user.id;

  // Verificar que el match existe
  const match = await Match.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match no encontrado'
    });
  }

  // Verificar que el usuario es parte del match
  if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'No tienes permiso para actualizar estos mensajes'
    });
  }

  // Marcar como leídos todos los mensajes dirigidos al usuario
  const result = await Message.updateMany(
    {
      match: matchId,
      receiver: userId,
      read: false
    },
    {
      read: true
    }
  );

  res.status(200).json({
    success: true,
    data: {
      matchId,
      messagesMarkedAsRead: result.nModified || 0
    }
  });
});

/**
 * @desc    Obtener todas las conversaciones del usuario
 * @route   GET /api/messages/conversations
 * @access  Private
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Buscar todos los matches confirmados del usuario
  const matches = await Match.find({
    $or: [
      { userA: userId },
      { userB: userId }
    ],
    isMatch: true
  }).populate('userA', 'name profilePicture')
    .populate('userB', 'name profilePicture');

  // Para cada match, obtener el último mensaje y los no leídos
  const conversations = await Promise.all(matches.map(async (match) => {
    // Determinar quién es el otro usuario
    const otherUser = match.userA._id.toString() === userId 
      ? match.userB 
      : match.userA;
    
    // Obtener el último mensaje
    const lastMessage = await Message.findOne({ match: match._id })
      .sort({ createdAt: -1 })
      .select('content createdAt read');
    
    // Contar mensajes no leídos
    const unreadCount = await Message.countDocuments({
      match: match._id,
      receiver: userId,
      read: false
    });
    
    return {
      matchId: match._id,
      user: {
        id: otherUser._id,
        name: otherUser.name,
        profilePicture: otherUser.profilePicture
      },
      lastMessage: lastMessage || null,
      unreadCount,
      musicCompatibility: match.score,
      createdAt: match.createdAt
    };
  }));
  
  // Ordenar por fecha del último mensaje (más reciente primero)
  conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
  });

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

/**
 * @desc    Obtener conteo de mensajes no leídos
 * @route   GET /api/messages/unread
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Contar mensajes no leídos para el usuario
  const unreadCount = await Message.countDocuments({
    receiver: userId,
    read: false
  });

  res.status(200).json({
    success: true,
    data: {
      unreadCount
    }
  });
}); 