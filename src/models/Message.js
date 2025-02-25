const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  content: {
    type: String,
    required: [true, 'El contenido del mensaje no puede estar vacío'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder los 1000 caracteres']
  },
  attachments: [{
    type: String, // URL o ruta al archivo adjunto
    default: []
  }],
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para buscar mensajes entre dos usuarios para un match específico
MessageSchema.index({ match: 1, createdAt: 1 });

// Índice para buscar mensajes no leídos
MessageSchema.index({ receiver: 1, read: 1 });

// Método para marcar mensaje como leído
MessageSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
  return this;
};

module.exports = mongoose.model('Message', MessageSchema); 