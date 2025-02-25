# VibeApp - Aplicación de Citas basada en Preferencias Musicales

VibeApp es una aplicación de citas innovadora que conecta a personas a través de sus gustos musicales. A diferencia de otras aplicaciones de citas que se centran principalmente en la apariencia, VibeApp utiliza un algoritmo de compatibilidad musical para encontrar conexiones genuinas basadas en preferencias musicales compartidas.

## 🎵 Características Principales

- **Autenticación Segura**: Registro e inicio de sesión con email/contraseña o mediante OAuth (Google, Facebook)
- **Perfiles Musicales**: Conecta con Spotify para importar automáticamente tus géneros y canciones favoritas
- **Algoritmo de Matching**: Sistema inteligente que calcula la compatibilidad musical entre usuarios
- **Interfaz de Swipe**: Descubre perfiles compatibles con una interfaz intuitiva tipo Tinder
- **Chat en Tiempo Real**: Comunícate instantáneamente con tus matches mediante Socket.IO
- **Notificaciones**: Recibe alertas sobre nuevos matches, mensajes y likes
- **Modo Demo**: Prueba todas las funcionalidades sin necesidad de una base de datos

## 🚀 Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Base de Datos**: MongoDB con Mongoose (opcional en modo demo)
- **Autenticación**: JWT, Passport.js
- **Tiempo Real**: Socket.IO
- **Frontend**: HTML, CSS, JavaScript (vanilla)

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- MongoDB (opcional, solo si no usas el modo demo)

## 🔧 Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/Oruga420/vibe-coding-tinderfy.git
   cd vibe-coding-tinderfy
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto basado en el ejemplo proporcionado
   - Configura tus credenciales de Spotify, Google, Facebook, etc. (opcional)

4. Inicia la aplicación:
   ```bash
   # Modo desarrollo
   npm run dev
   
   # Modo producción
   npm start
   ```

## 🎮 Modo Demo

VibeApp incluye un modo demo que permite probar todas las funcionalidades sin necesidad de configurar una base de datos o servicios externos. Para activarlo:

1. Asegúrate de que en tu archivo `.env` esté configurado:
   ```
   DEMO_MODE=true
   ```

2. Inicia la aplicación normalmente:
   ```bash
   npm run dev
   ```

3. Accede a las rutas de demostración:
   - http://localhost:3000/demo
   - http://localhost:3000/demo/match
   - http://localhost:3000/demo/swipe
   - http://localhost:3000/demo/chat
   - http://localhost:3000/demo/notifications

## 📱 Flujo de Usuario

1. **Registro/Login**: El usuario se registra o inicia sesión
2. **Perfil**: Configura su perfil y preferencias musicales
3. **Descubrimiento**: Explora perfiles compatibles mediante swipes
4. **Matching**: Cuando dos usuarios se dan like mutuamente, se crea un match
5. **Chat**: Los usuarios pueden chatear en tiempo real
6. **Notificaciones**: Reciben alertas sobre actividad relevante

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre primero un issue para discutir lo que te gustaría cambiar.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

Si tienes preguntas o sugerencias, no dudes en abrir un issue o contactarme directamente.

---

Desarrollado con ❤️ y 🎵 