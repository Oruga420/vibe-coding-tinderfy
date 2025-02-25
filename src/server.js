const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

// Initialize app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: '*', // En producción, limitar a dominios específicos
    methods: ['GET', 'POST']
  }
});

// Make io accessible from routes
app.set('io', io);

// Inicializar servicio de notificaciones
const NotificationService = require('./utils/notificationService');
const notificationService = new NotificationService(io);
app.set('notificationService', notificationService);

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// File upload
app.use(fileUpload({
  limits: { fileSize: process.env.MAX_FILE_SIZE || 1000000 }, // default 1MB
  abortOnLimit: true,
  createParentPath: true
}));

// Passport middleware
app.use(passport.initialize());

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));

// Variable global para modo demo (sin MongoDB)
const DEMO_MODE = process.env.DEMO_MODE === 'true' || false;

// Connect to MongoDB if not in demo mode
if (!DEMO_MODE) {
  try {
    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vibeapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    console.log('Starting in demo mode...');
  }
}

// Socket.IO Authentication
io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  } else {
    // En modo demo, permitir conexiones sin token
    if (DEMO_MODE) {
      socket.decoded = { id: 'demo_user_id' };
      return next();
    }
    next(new Error('Authentication error'));
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('Nueva conexión de socket: ' + socket.id);
  
  // Unir al usuario a su sala personal (basada en su ID)
  const userId = socket.decoded.id;
  socket.join(userId);
  
  // Unirse a salas de match específicas
  socket.on('joinMatchRoom', ({ matchId }) => {
    socket.join(`match_${matchId}`);
    console.log(`Usuario ${userId} unido a la sala del match ${matchId}`);
  });
  
  // Abandonar sala de match
  socket.on('leaveMatchRoom', ({ matchId }) => {
    socket.leave(`match_${matchId}`);
    console.log(`Usuario ${userId} abandonó la sala del match ${matchId}`);
  });
  
  // Escuchar estado de "escribiendo"
  socket.on('typing', ({ matchId, isTyping }) => {
    // Emitir a todos en la sala del match excepto el remitente
    socket.to(`match_${matchId}`).emit('userTyping', {
      userId,
      isTyping
    });
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado: ' + socket.id);
  });
});

// Import route files
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchRoutes = require('./routes/match');
const swipeRoutes = require('./routes/swipe');
const messageRoutes = require('./routes/message');
const notificationRoutes = require('./routes/notification'); // Importar rutas de notificaciones

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes); // Montar rutas de notificaciones

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'VibeApp API funcionando!',
    demoMode: DEMO_MODE
  });
});

// Página de demo
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/demo.html'));
});

// Página de demo para el módulo de matching
app.get('/demo/match', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/match-demo.html'));
});

// Ruta para la interfaz de swipe
app.get('/demo/swipe', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/swipe-interface.html'));
});

// Ruta para la interfaz de chat
app.get('/demo/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

// Ruta para la interfaz de notificaciones
app.get('/demo/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/notifications-demo.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Error en el servidor'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT} ${DEMO_MODE ? '(Modo Demo)' : ''}`);
}); 