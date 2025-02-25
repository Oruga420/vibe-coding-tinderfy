# Solución: Módulo de Autenticación para VibeApp

## Descripción General

Este módulo gestiona el proceso de registro, inicio de sesión y autenticación de usuarios para la aplicación VibeApp, siguiendo los requerimientos especificados y asegurando que cada cuenta esté protegida y sea única.

## Componentes Principales

### 1. Modelo de Usuario

El modelo de usuario (`User.js`) incluye campos para:
- Nombre de usuario
- Correo electrónico (validado)
- Contraseña (encriptada)
- IDs de redes sociales (Google, Facebook)
- Imagen de perfil
- Tokens para recuperación de contraseña
- Rol (usuario/admin)

### 2. Autenticación Local

- Registro de usuarios con validación de datos
- Inicio de sesión con verificación de credenciales
- Generación de tokens JWT para mantener la sesión
- Protección de rutas mediante middleware

### 3. Autenticación OAuth

- Integración con Google usando passport-google-oauth20
- Integración con Facebook usando passport-facebook
- Creación automática de perfiles para nuevos usuarios
- Vinculación con cuentas existentes por correo electrónico

### 4. Recuperación de Contraseñas

- Generación de tokens de recuperación
- Validación temporal de tokens
- Reinicio seguro de contraseñas

### 5. Middleware de Seguridad

- Protección de rutas privadas
- Control de acceso basado en roles
- Validación de datos de entrada

## Flujo de Autenticación

1. **Registro**:
   - El usuario envía sus datos (nombre, correo, contraseña)
   - Se validan los datos
   - Se verifica que el correo no esté en uso
   - Se encripta la contraseña
   - Se crea el usuario y se genera un token JWT

2. **Inicio de Sesión**:
   - El usuario envía sus credenciales (correo, contraseña)
   - Se verifica que el usuario exista
   - Se compara la contraseña encriptada
   - Se genera un token JWT

3. **Autenticación OAuth**:
   - El usuario selecciona iniciar sesión con Google/Facebook
   - Se redirecciona a la autenticación del proveedor
   - El proveedor redirecciona de vuelta con los datos del usuario
   - Se crea un usuario nuevo o se vincula con uno existente
   - Se genera un token JWT

4. **Recuperación de Contraseña**:
   - El usuario solicita recuperación con su correo
   - Se genera un token y se almacena en la base de datos
   - Se envía un enlace al correo del usuario
   - El usuario accede al enlace y establece una nueva contraseña
   - Se actualiza la contraseña y se elimina el token

## Consideraciones Técnicas

1. **Seguridad**:
   - Encriptación de contraseñas con bcrypt
   - Tokens JWT con tiempo de expiración
   - Validación estricta de datos de entrada
   - Mensajes de error generales para evitar enumeración

2. **Escalabilidad**:
   - Arquitectura modular y separada por responsabilidades
   - Fácil extensión para nuevos proveedores OAuth
   - Configuración mediante variables de entorno

3. **Experiencia de Usuario**:
   - Mensajes de error claros y en español
   - Múltiples opciones de autenticación
   - Proceso simple de recuperación de contraseña

## APIs Expuestas

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener datos del usuario actual
- `POST /api/auth/forgotpassword` - Solicitar recuperación de contraseña
- `PUT /api/auth/resetpassword/:resettoken` - Restablecer contraseña
- `GET /api/auth/logout` - Cerrar sesión
- `GET /api/auth/google` - Autenticación con Google
- `GET /api/auth/facebook` - Autenticación con Facebook

## Tecnologías Utilizadas

- **Node.js y Express** - Backend y API RESTful
- **MongoDB y Mongoose** - Base de datos y ODM
- **Passport.js** - Autenticación OAuth
- **JWT** - Tokens de autenticación
- **bcrypt** - Encriptación de contraseñas
- **express-validator** - Validación de datos de entrada

## Mejoras Futuras

- Implementación de autenticación de dos factores
- Integración con más proveedores OAuth (Twitter, Apple, etc.)
- Sistema de verificación de correo electrónico
- Gestión de sesiones activas
- Historial de inicios de sesión
