# VibeApp - API Backend

Este proyecto contiene el backend para VibeApp, una aplicación de citas basada en preferencias musicales.

## Módulos Implementados

### 1. Módulo de Autenticación

Gestiona el registro, inicio de sesión y autenticación de usuarios, asegurando que cada cuenta esté protegida y sea única.

#### Características

- Registro de usuarios con validación de datos
- Inicio de sesión seguro con JWT
- Integración con OAuth (Google y Facebook)
- Recuperación de contraseñas
- Perfiles de usuario
- Protección de rutas con middleware

### 2. Módulo de Gestión de Perfil

Permite a los usuarios crear y editar su perfil, incluyendo información personal, fotografías y preferencias musicales.

#### Características

- Edición de perfil (nombre, biografía, edad, ubicación)
- Carga y gestión de imágenes de perfil y galería
- Gestión de preferencias musicales (géneros y canciones)
- Integración con Spotify para importar preferencias automáticamente

### 3. Módulo de Matching basado en Música

Algoritmo inteligente que analiza las preferencias musicales de los usuarios y genera matches basados en la compatibilidad musical.

### 4. Módulo de Algoritmo de Matching basado en Música

Algoritmo inteligente que analiza las preferencias musicales de los usuarios y genera matches basados en la compatibilidad musical.

#### Características

- Análisis de similitud musical basado en géneros y canciones favoritas
- Sistema de puntuación de compatibilidad (0-100%)
- Umbral ajustable para la generación de matches
- Estadísticas detalladas sobre matches y compatibilidad
- Recomendaciones musicales basadas en matches

### 5. Módulo de Interfaz de Swipe y Descubrimiento de Matches

Interfaz tipo Tinder que permite a los usuarios descubrir perfiles compatibles mediante gestos de swipe (deslizar) y visualizar información relevante sobre compatibilidad musical.

#### Características

- Interfaz de swipe intuitiva (deslizar a la derecha para like, izquierda para rechazar)
- Animaciones fluidas y feedback visual durante las interacciones
- Tarjetas de perfil con información detallada sobre gustos musicales
- Indicadores de compatibilidad musical
- Notificaciones en tiempo real de matches mutuos

### 6. Módulo de Mensajería

Permite a los usuarios enviar y recibir mensajes con otros usuarios.

#### Características

- Obtener todas las conversaciones del usuario
- Obtener cantidad de mensajes no leídos
- Enviar un mensaje
- Obtener historial de chat de un match específico
- Marcar mensajes como leídos

### 7. Módulo de Notificaciones en Tiempo Real

Sistema que permite a los usuarios recibir y gestionar notificaciones sobre eventos importantes en la aplicación.

#### Características

- **Notificaciones en tiempo real:** Alertas instantáneas sobre matches, mensajes y likes.
- **Centro de notificaciones:** Interfaz centralizada para gestionar todas las notificaciones.
- **Preferencias personalizables:** Configuración de qué tipos de notificaciones recibir.
- **Múltiples tipos de notificaciones:**
  - Notificaciones de match
  - Notificaciones de mensajes
  - Notificaciones de likes
  - Notificaciones del sistema

## Requisitos Técnicos

- Node.js
- MongoDB
- Express
- Passport.js para OAuth
- JWT para autenticación

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno en un archivo `.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vibeapp
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@vibeapp.com
MAX_FILE_SIZE=5000000
```

4. Iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

## API Endpoints

### Autenticación

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener datos del usuario actual
- `POST /api/auth/forgotpassword` - Solicitar recuperación de contraseña
- `PUT /api/auth/resetpassword/:resettoken` - Restablecer contraseña
- `GET /api/auth/logout` - Cerrar sesión

### OAuth

- `GET /api/auth/google` - Autenticación con Google
- `GET /api/auth/facebook` - Autenticación con Facebook

### Gestión de Perfil

- `GET /api/profile/me` - Obtener perfil del usuario actual
- `PUT /api/profile` - Actualizar perfil
- `PUT /api/profile/picture` - Subir/actualizar foto de perfil
- `POST /api/profile/gallery` - Añadir foto a la galería
- `DELETE /api/profile/gallery/:filename` - Eliminar foto de la galería
- `POST /api/profile/songs` - Añadir canción favorita
- `DELETE /api/profile/songs/:songId` - Eliminar canción favorita
- `PUT /api/profile/genres` - Actualizar géneros favoritos
- `POST /api/profile/spotify` - Conectar cuenta de Spotify
- `GET /api/profile/spotify/data` - Obtener datos de Spotify (canciones y géneros top)
- `GET /api/profile/spotify/search` - Buscar canciones en Spotify

### Matching

- `GET /api/match/generate` - Generar matches para el usuario
- `GET /api/match` - Obtener todos los matches del usuario
- `GET /api/match/:id` - Obtener un match específico
- `PUT /api/match/:id/status` - Actualizar estado de un match (aceptar/rechazar)
- `GET /api/match/stats` - Obtener estadísticas de matches
- `GET /api/match/recommendations` - Obtener recomendaciones de canciones basadas en matches

### Swipe y Descubrimiento

- `GET /api/swipe/profiles` - Obtener perfiles para descubrir
- `POST /api/swipe/action` - Realizar acción de swipe (like/dislike)
- `GET /api/swipe/stats` - Obtener estadísticas de swipe del usuario

### Mensajería

- `GET /api/messages/conversations` - Obtener todas las conversaciones del usuario
- `GET /api/messages/unread` - Obtener cantidad de mensajes no leídos
- `POST /api/messages` - Enviar un mensaje
- `GET /api/messages/:matchId` - Obtener historial de chat de un match específico
- `PUT /api/messages/read/:matchId` - Marcar mensajes como leídos

### Notificaciones

- `GET /api/notifications` - Obtener todas las notificaciones del usuario
- `GET /api/notifications/unread/count` - Obtener cantidad de notificaciones no leídas
- `PUT /api/notifications/read` - Marcar notificaciones como leídas
- `DELETE /api/notifications/:id` - Eliminar una notificación
- `PUT /api/notifications/preferences` - Actualizar preferencias de notificaciones
- `PUT /api/notifications/token` - Registrar token FCM para notificaciones push

## Flujo de Autenticación

1. El usuario se registra o inicia sesión
2. Al autenticarse correctamente, recibe un token JWT
3. El token se almacena en el cliente (localStorage, cookie, etc.)
4. Para acceder a rutas protegidas, el cliente envía el token en el header `Authorization: Bearer <token>`
5. El servidor verifica el token y permite o deniega el acceso

## Flujo de Gestión de Perfil

1. El usuario accede a su perfil utilizando el token JWT
2. Puede editar su información personal y preferencias
3. Puede cargar imágenes para su perfil y galería
4. Puede gestionar sus preferencias musicales manualmente o conectando Spotify
5. Los cambios se guardan al instante y están disponibles para el sistema de matching

## Flujo de Matching Musical

1. El usuario completa su perfil musical (géneros y canciones favoritas)
2. El algoritmo analiza las preferencias y genera una lista de posibles matches
3. El usuario puede aceptar o rechazar los matches sugeridos
4. Cuando dos usuarios se aceptan mutuamente, se crea un match oficial
5. El sistema proporciona recomendaciones musicales basadas en matches

## Flujo de Descubrimiento mediante Swipe

1. El usuario accede a la interfaz de descubrimiento
2. Se cargan perfiles compatibles basados en el algoritmo de matching
3. El usuario puede ver detalles de cada perfil, incluyendo gustos musicales
4. El usuario desliza a la derecha (like) o izquierda (rechazo)
5. Si hay match mutuo, se muestra una notificación y se establece la conexión

## Flujo de Mensajería

1. El usuario accede a la interfaz de chat después de obtener matches
2. Puede ver la lista de todas sus conversaciones con matches
3. Al seleccionar una conversación, se carga el historial de mensajes
4. El usuario puede enviar mensajes en tiempo real y ver cuando el otro usuario está escribiendo
5. Las notificaciones de mensajes nuevos aparecen en tiempo real
6. Los mensajes se marcan como leídos automáticamente al abrir una conversación

## Estructura del Proyecto

```
├── src/
│   ├── config/
│   │   ├── db.js             # Configuración de la base de datos
│   │   └── passport.js       # Configuración de passport para OAuth
│   ├── controllers/
│   │   ├── auth.js           # Controladores de autenticación
│   │   ├── profile.js        # Controladores de perfil
│   │   ├── match.js          # Controladores de matching
│   │   ├── swipe.js          # Controladores de swipe
│   │   ├── message.js        # Controladores de mensajería
│   │   └── notification.js   # Controladores de notificaciones
│   ├── middleware/
│   │   ├── auth.js           # Middleware de autenticación
│   │   └── validators.js     # Validadores de entrada
│   ├── models/
│   │   ├── User.js           # Modelo de usuario
│   │   ├── Match.js          # Modelo de match
│   │   ├── Message.js        # Modelo de mensaje
│   │   └── Notification.js   # Modelo de notificación
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación
│   │   ├── profile.js        # Rutas de perfil
│   │   ├── match.js          # Rutas de matching
│   │   ├── swipe.js          # Rutas de swipe
│   │   ├── message.js        # Rutas de mensajería
│   │   └── notification.js   # Rutas de notificaciones
│   ├── utils/
│   │   ├── spotifyAPI.js     # Utilidades para integración con Spotify
│   │   ├── matchingAlgorithm.js # Algoritmo de matching
│   │   └── notificationService.js # Servicio de notificaciones
│   └── server.js             # Archivo principal del servidor
├── public/
│   ├── uploads/              # Archivos subidos por los usuarios
│   ├── defaults/             # Archivos por defecto
│   ├── chat.html             # Interfaz de chat
│   ├── swipe-interface.html  # Interfaz de swipe
│   └── notifications-demo.html # Interfaz de notificaciones
├── .env                      # Variables de entorno
├── package.json              # Dependencias y scripts
└── README.md                 # Documentación
```

## Consideraciones de Seguridad

- Las contraseñas se encriptan con bcrypt
- Autenticación JWT con expiración
- Validación de datos de entrada
- Manejo de errores adecuado
- Protección contra ataques comunes
- Validación de tipos y tamaños de archivos 