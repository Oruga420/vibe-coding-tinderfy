const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  addGalleryImage,
  deleteGalleryImage,
  addFavoriteSong,
  removeFavoriteSong,
  updateFavoriteGenres,
  connectSpotify,
  getSpotifyData,
  searchSpotifyTracks
} = require('../controllers/profile');

const { protect } = require('../middleware/auth');
const {
  updateProfileValidator,
  addSongValidator,
  updateGenresValidator,
  connectSpotifyValidator
} = require('../middleware/validators');

const router = express.Router();

// Todas las rutas de perfil requieren autenticación
router.use(protect);

// Rutas principales de perfil
router.get('/me', getProfile);
router.put('/', updateProfileValidator, updateProfile);

// Rutas para imágenes
router.put('/picture', uploadProfilePicture);
router.post('/gallery', addGalleryImage);
router.delete('/gallery/:filename', deleteGalleryImage);

// Rutas para preferencias musicales
router.post('/songs', addSongValidator, addFavoriteSong);
router.delete('/songs/:songId', removeFavoriteSong);
router.put('/genres', updateGenresValidator, updateFavoriteGenres);

// Rutas para Spotify
router.post('/spotify', connectSpotifyValidator, connectSpotify);
router.get('/spotify/data', getSpotifyData);
router.get('/spotify/search', searchSpotifyTracks);

module.exports = router; 