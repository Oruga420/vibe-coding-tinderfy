const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const spotifyAPI = require('../utils/spotifyAPI');

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Fields to update
    const {
      name,
      bio,
      age,
      location,
      favoriteGenres,
      favoriteSongs,
      favoriteArtists
    } = req.body;

    // Build profile object
    const profileFields = {};
    
    if (name) profileFields.name = name;
    if (bio) profileFields.bio = bio;
    if (age) profileFields.age = age;
    if (location) profileFields.location = location;
    if (favoriteGenres) profileFields.favoriteGenres = favoriteGenres;
    if (favoriteSongs) profileFields.favoriteSongs = favoriteSongs;
    if (favoriteArtists) profileFields.favoriteArtists = favoriteArtists;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba una imagen'
      });
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Por favor suba una imagen menor a ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }

    // Create custom filename
    file.name = `photo_${req.user.id}${path.parse(file.name).ext}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to upload path
    file.mv(`${uploadDir}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Update user profile picture in database
      await User.findByIdAndUpdate(req.user.id, {
        profilePicture: file.name
      });

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Add image to user gallery
// @route   POST /api/profile/gallery
// @access  Private
exports.addGalleryImage = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba una imagen'
      });
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Por favor suba una imagen menor a ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }

    // Create custom filename
    file.name = `gallery_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = './public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to upload path
    file.mv(`${uploadDir}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          error: 'Problema al subir el archivo'
        });
      }

      // Add image to user gallery
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      user.galleryImages.push(file.name);
      await user.save();

      res.status(200).json({
        success: true,
        data: file.name
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/profile/gallery/:filename
// @access  Private
exports.deleteGalleryImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Check if image exists in gallery
    if (!user.galleryImages.includes(req.params.filename)) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    // Remove image from gallery
    user.galleryImages = user.galleryImages.filter(
      image => image !== req.params.filename
    );
    await user.save();

    // Delete image from filesystem
    const imagePath = `./public/uploads/${req.params.filename}`;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Add favorite song
// @route   POST /api/profile/songs
// @access  Private
exports.addFavoriteSong = async (req, res) => {
  try {
    const { title, artist, spotifyId } = req.body;

    if (!title || !artist) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione título y artista de la canción'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Add song to favorites
    user.favoriteSongs.push({ title, artist, spotifyId });
    await user.save();

    res.status(200).json({
      success: true,
      data: user.favoriteSongs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Remove favorite song
// @route   DELETE /api/profile/songs/:songId
// @access  Private
exports.removeFavoriteSong = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Remove song from favorites
    user.favoriteSongs = user.favoriteSongs.filter(
      song => song._id.toString() !== req.params.songId
    );
    await user.save();

    res.status(200).json({
      success: true,
      data: user.favoriteSongs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Update favorite genres
// @route   PUT /api/profile/genres
// @access  Private
exports.updateFavoriteGenres = async (req, res) => {
  try {
    const { genres } = req.body;

    if (!genres || !Array.isArray(genres)) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione un array de géneros musicales'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Update genres
    user.favoriteGenres = genres;
    await user.save();

    res.status(200).json({
      success: true,
      data: user.favoriteGenres
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Connect Spotify account
// @route   POST /api/profile/spotify
// @access  Private
exports.connectSpotify = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione el token de Spotify'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Update Spotify connection
    user.spotifyConnected = true;
    user.spotifyRefreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        spotifyConnected: true
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// @desc    Get Spotify data (top tracks and genres)
// @route   GET /api/profile/spotify/data
// @access  Private
exports.getSpotifyData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (!user.spotifyConnected || !user.spotifyRefreshToken) {
      return res.status(400).json({
        success: false,
        error: 'No hay conexión con Spotify'
      });
    }

    // Get access token from refresh token
    const accessToken = await spotifyAPI.getAccessToken(user.spotifyRefreshToken);

    // Get top tracks and genres
    const [topTracks, topGenres] = await Promise.all([
      spotifyAPI.getTopTracks(accessToken, 10),
      spotifyAPI.getTopGenres(accessToken)
    ]);

    res.status(200).json({
      success: true,
      data: {
        topTracks,
        topGenres
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error en el servidor'
    });
  }
};

// @desc    Search Spotify tracks
// @route   GET /api/profile/spotify/search
// @access  Private
exports.searchSpotifyTracks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (!user.spotifyConnected || !user.spotifyRefreshToken) {
      return res.status(400).json({
        success: false,
        error: 'No hay conexión con Spotify'
      });
    }

    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione un término de búsqueda'
      });
    }

    // Get access token from refresh token
    const accessToken = await spotifyAPI.getAccessToken(user.spotifyRefreshToken);

    // Search tracks
    const tracks = await spotifyAPI.searchTracks(accessToken, query);

    res.status(200).json({
      success: true,
      data: tracks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error en el servidor'
    });
  }
}; 