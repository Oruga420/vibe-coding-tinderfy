const axios = require('axios');

/**
 * Obtener un token de acceso de Spotify usando un refresh token
 * @param {string} refreshToken - Token de actualización de Spotify
 * @returns {Promise<string>} - Token de acceso
 */
exports.getAccessToken = async (refreshToken) => {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error obteniendo token de acceso de Spotify:', error);
    throw new Error('Error de autenticación con Spotify');
  }
};

/**
 * Obtener las canciones top del usuario
 * @param {string} accessToken - Token de acceso de Spotify
 * @param {number} limit - Número de canciones a obtener (máximo 50)
 * @returns {Promise<Array>} - Array de canciones top
 */
exports.getTopTracks = async (accessToken, limit = 10) => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.spotify.com/v1/me/top/tracks',
      params: {
        limit: limit,
        time_range: 'medium_term' // last 6 months
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.items.map(track => ({
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      spotifyId: track.id,
      albumCover: track.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error('Error obteniendo canciones top de Spotify:', error);
    throw new Error('Error obteniendo datos de Spotify');
  }
};

/**
 * Obtener los géneros top del usuario basados en sus artistas
 * @param {string} accessToken - Token de acceso de Spotify
 * @returns {Promise<Array>} - Array de géneros
 */
exports.getTopGenres = async (accessToken) => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.spotify.com/v1/me/top/artists',
      params: {
        limit: 20,
        time_range: 'medium_term' // last 6 months
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Extraer géneros y contar frecuencias
    const genreCount = {};
    response.data.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Convertir a array y ordenar por frecuencia
    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return sortedGenres;
  } catch (error) {
    console.error('Error obteniendo géneros top de Spotify:', error);
    throw new Error('Error obteniendo datos de Spotify');
  }
};

/**
 * Buscar canciones en Spotify
 * @param {string} accessToken - Token de acceso de Spotify
 * @param {string} query - Texto a buscar
 * @param {number} limit - Número de resultados a obtener
 * @returns {Promise<Array>} - Array de canciones encontradas
 */
exports.searchTracks = async (accessToken, query, limit = 5) => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.spotify.com/v1/search',
      params: {
        q: query,
        type: 'track',
        limit: limit
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.tracks.items.map(track => ({
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      spotifyId: track.id,
      albumCover: track.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error('Error buscando canciones en Spotify:', error);
    throw new Error('Error buscando en Spotify');
  }
}; 