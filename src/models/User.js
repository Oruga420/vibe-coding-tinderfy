const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese su nombre']
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese su correo electrónico'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un correo electrónico válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Campos adicionales para el perfil
  bio: {
    type: String,
    maxlength: [500, 'La biografía no puede tener más de 500 caracteres']
  },
  age: {
    type: Number,
    min: [18, 'Debes tener al menos 18 años para usar esta aplicación']
  },
  location: {
    type: String
  },
  // Preferencias musicales
  favoriteGenres: [{
    type: String
  }],
  favoriteSongs: [{
    title: String,
    artist: String,
    spotifyId: String
  }],
  favoriteArtists: [{
    name: String,
    spotifyId: String
  }],
  // Conexión con servicios de música
  spotifyConnected: {
    type: Boolean,
    default: false
  },
  spotifyRefreshToken: {
    type: String
  },
  // Imágenes de perfil
  profilePicture: {
    type: String,
    default: 'default-profile.jpg'
  },
  galleryImages: [{
    type: String
  }],
  // OAuth
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  // Recuperación de contraseña
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Preferencias de notificaciones
  notificationPreferences: {
    enablePush: {
      type: Boolean,
      default: true
    },
    enableEmail: {
      type: Boolean,
      default: true
    },
    matchNotifications: {
      type: Boolean,
      default: true
    },
    messageNotifications: {
      type: Boolean,
      default: true
    },
    likeNotifications: {
      type: Boolean,
      default: true
    }
  },
  // Token para notificaciones push (Firebase Cloud Messaging)
  fcmToken: {
    type: String
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema); 