const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  // Los dos usuarios involucrados en el match
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Puntuación de compatibilidad musical (0-100)
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Detalles del cálculo de compatibilidad
  matchDetails: {
    commonSongs: [String], // IDs de canciones en común
    commonGenres: [String], // Géneros en común
    genreScore: Number, // Puntuación por similitud de géneros (0-100)
    songsScore: Number, // Puntuación por canciones en común (0-100)
    artistsScore: Number // Puntuación por artistas en común (0-100)
  },
  // Estado del match (pendiente, aceptado, rechazado)
  status: {
    userAStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    userBStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  // Si ambos usuarios han aceptado, es un match oficial
  isMatch: {
    type: Boolean,
    default: false
  },
  // Fecha de creación y actualización
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compuesto único para evitar duplicados entre los mismos usuarios
MatchSchema.index({ userA: 1, userB: 1 }, { unique: true });

// Actualizar el campo updatedAt en cada modificación
MatchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Actualizar isMatch si ambos usuarios han aceptado
MatchSchema.pre('save', function(next) {
  if (this.status.userAStatus === 'accepted' && this.status.userBStatus === 'accepted') {
    this.isMatch = true;
  } else {
    this.isMatch = false;
  }
  next();
});

module.exports = mongoose.model('Match', MatchSchema); 