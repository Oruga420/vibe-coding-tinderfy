const { check, validationResult } = require('express-validator');

// Middleware para validar resultados
exports.validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validadores de autenticación
exports.registerValidator = [
  check('name', 'El nombre es requerido').not().isEmpty(),
  check('email', 'Por favor incluye un email válido').isEmail(),
  check('password', 'Por favor ingresa una contraseña con 6 o más caracteres').isLength({ min: 6 })
];

exports.loginValidator = [
  check('email', 'Por favor incluye un email válido').isEmail(),
  check('password', 'La contraseña es requerida').exists()
];

exports.forgotPasswordValidator = [
  check('email', 'Por favor incluya un correo electrónico válido').isEmail()
];

exports.resetPasswordValidator = [
  check('password', 'Por favor ingrese una contraseña con 6 o más caracteres').isLength({ min: 6 })
];

// Validadores de perfil
exports.updateProfileValidator = [
  check('name', 'El nombre no puede estar vacío si se proporciona').optional().not().isEmpty(),
  check('email', 'El email debe ser válido si se proporciona').optional().isEmail(),
  check('location', 'La ubicación no puede estar vacía si se proporciona').optional().not().isEmpty(),
  check('age', 'La edad debe ser un número entre 18 y 120').optional().isInt({ min: 18, max: 120 }),
  check('bio', 'La biografía no puede exceder 500 caracteres').optional().isLength({ max: 500 })
];

exports.updateGenresValidator = [
  check('genres', 'Los géneros deben ser un array').isArray(),
  check('genres.*', 'Cada género debe ser una cadena no vacía').isString().not().isEmpty()
];

exports.addSongValidator = [
  check('title', 'El título de la canción es requerido').not().isEmpty(),
  check('artist', 'El artista de la canción es requerido').not().isEmpty(),
  check('spotifyId', 'El ID de Spotify debe ser válido si se proporciona').optional().not().isEmpty()
];

// Validadores de matching
exports.updateMatchStatusValidator = [
  check('status', 'El estado debe ser pending, accepted o rejected')
    .isIn(['pending', 'accepted', 'rejected'])
];

exports.generateMatchesValidator = [
  check('minScore', 'La puntuación mínima debe ser un número entre 0 y 100')
    .optional()
    .isInt({ min: 0, max: 100 }),
  
  check('limit', 'El límite debe ser un número positivo')
    .optional()
    .isInt({ min: 1 }),
    
  check('includeFilters', 'El parámetro de filtros debe ser booleano')
    .optional()
    .isBoolean()
];

exports.matchFilterValidator = [
  check('minAge', 'La edad mínima debe ser un número mayor a 18')
    .optional()
    .isInt({ min: 18 }),
    
  check('maxAge', 'La edad máxima debe ser un número válido')
    .optional()
    .isInt({ min: 18 }),
    
  check('location', 'La ubicación debe ser una cadena')
    .optional()
    .isString(),
    
  check('minScore', 'La puntuación mínima debe ser un número entre 0 y 100')
    .optional()
    .isInt({ min: 0, max: 100 }),
    
  check('mustHavePhoto', 'El parámetro debe ser booleano')
    .optional()
    .isBoolean()
];

exports.connectSpotifyValidator = [
  check('refreshToken', 'El token de Spotify es requerido').not().isEmpty()
];

// Validadores de swipe
exports.swipeActionValidator = [
  check('targetUserId', 'El ID del usuario objetivo es requerido').not().isEmpty(),
  check('action', 'La acción debe ser like o dislike').isIn(['like', 'dislike'])
];

exports.swipeProfilesValidator = [
  check('limit', 'El límite debe ser un número positivo')
    .optional()
    .isInt({ min: 1, max: 100 })
];

// Validadores de mensajería
exports.sendMessageValidator = [
  check('matchId', 'Se requiere un ID de match válido').isMongoId(),
  check('content', 'El contenido del mensaje no puede estar vacío').not().isEmpty(),
  check('content', 'El mensaje no puede exceder los 1000 caracteres').isLength({ max: 1000 }),
  check('attachments', 'Los adjuntos deben ser un array')
    .optional()
    .isArray()
]; 