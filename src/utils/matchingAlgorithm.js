/**
 * Utilidades para el algoritmo de compatibilidad musical
 */

// Pesos para cada categoría en el cálculo de compatibilidad
const WEIGHTS = {
  GENRES: 0.4,  // 40% de la puntuación
  SONGS: 0.4,   // 40% de la puntuación
  ARTISTS: 0.2  // 20% de la puntuación
};

// Umbrales de compatibilidad
const THRESHOLDS = {
  HIGH_MATCH: 75,   // Mayor a 75% es alta compatibilidad
  MEDIUM_MATCH: 50, // Entre 50% y 75% es compatibilidad media
  LOW_MATCH: 25     // Entre 25% y 50% es compatibilidad baja
};

/**
 * Calcula la similitud de Jaccard entre dos conjuntos
 * Medida: tamaño de la intersección / tamaño de la unión
 */
const jaccardSimilarity = (setA, setB) => {
  if (!setA || !setB || !setA.length || !setB.length) return 0;
  
  // Convertir a Set para facilitar las operaciones
  const a = new Set(setA);
  const b = new Set(setB);
  
  // Calcular intersección (elementos comunes)
  const intersection = new Set([...a].filter(x => b.has(x)));
  
  // Calcular unión (todos los elementos únicos)
  const union = new Set([...a, ...b]);
  
  // Si la unión está vacía, no hay comparación posible
  if (union.size === 0) return 0;
  
  // Retornar la similitud (0-1)
  return intersection.size / union.size;
};

/**
 * Calcula la puntuación de similitud de géneros musicales
 */
const calculateGenreScore = (genresA, genresB) => {
  // Normalizar los géneros (minúsculas, eliminar espacios, etc.)
  const normalizedA = genresA.map(g => g.toLowerCase().trim());
  const normalizedB = genresB.map(g => g.toLowerCase().trim());
  
  // Calcular similitud de Jaccard y convertir a porcentaje
  const similarity = jaccardSimilarity(normalizedA, normalizedB);
  return Math.round(similarity * 100);
};

/**
 * Calcula la puntuación de similitud de canciones
 */
const calculateSongsScore = (songsA, songsB) => {
  // Si ambos arrays están vacíos, la puntuación es 0
  if (!songsA.length && !songsB.length) return 0;
  
  // Extraer IDs de canciones para comparación
  const songIdsA = songsA.map(song => song.spotifyId || song.id || song);
  const songIdsB = songsB.map(song => song.spotifyId || song.id || song);
  
  // Calcular similitud de Jaccard y convertir a porcentaje
  const similarity = jaccardSimilarity(songIdsA, songIdsB);
  return Math.round(similarity * 100);
};

/**
 * Calcula la puntuación de similitud de artistas
 */
const calculateArtistsScore = (songsA, songsB) => {
  // Extraer artistas únicos de ambas listas de canciones
  const getArtistsFromSongs = (songs) => {
    const artists = new Set();
    songs.forEach(song => {
      // Si es objeto de canción con propiedad artist(s)
      if (song.artist) artists.add(song.artist.toLowerCase());
      else if (song.artists && Array.isArray(song.artists)) {
        song.artists.forEach(artist => {
          if (typeof artist === 'string') {
            artists.add(artist.toLowerCase());
          } else if (artist.name) {
            artists.add(artist.name.toLowerCase());
          }
        });
      }
    });
    return [...artists];
  };
  
  const artistsA = getArtistsFromSongs(songsA);
  const artistsB = getArtistsFromSongs(songsB);
  
  // Si no hay artistas para comparar, retornar 0
  if (!artistsA.length || !artistsB.length) return 0;
  
  // Calcular similitud de Jaccard y convertir a porcentaje
  const similarity = jaccardSimilarity(artistsA, artistsB);
  return Math.round(similarity * 100);
};

/**
 * Calcula la puntuación global de compatibilidad musical
 */
const calculateOverallScore = (genreScore, songsScore, artistsScore) => {
  // Aplicar los pesos a cada puntuación parcial
  const weightedScore = 
    (genreScore * WEIGHTS.GENRES) + 
    (songsScore * WEIGHTS.SONGS) + 
    (artistsScore * WEIGHTS.ARTISTS);
  
  // Redondear a entero
  return Math.round(weightedScore);
};

/**
 * Determina si dos usuarios son compatibles
 */
const areUsersCompatible = (score, threshold = THRESHOLDS.MEDIUM_MATCH) => {
  return score >= threshold;
};

/**
 * Encuentra elementos comunes entre dos arrays
 */
const findCommonElements = (arrayA, arrayB) => {
  // Si alguno de los arrays está vacío, no hay elementos comunes
  if (!arrayA || !arrayB || !arrayA.length || !arrayB.length) return [];
  
  // Convertir a sets y encontrar la intersección
  const setA = new Set(arrayA);
  return arrayB.filter(item => setA.has(item));
};

/**
 * Calcula la compatibilidad musical entre dos usuarios
 */
const calculateMusicCompatibility = (userA, userB) => {
  // Extraer datos relevantes
  const genresA = userA.musicPreferences?.favoriteGenres || [];
  const genresB = userB.musicPreferences?.favoriteGenres || [];
  
  const songsA = userA.musicPreferences?.favoriteSongs || [];
  const songsB = userB.musicPreferences?.favoriteSongs || [];
  
  // Calcular puntuaciones individuales
  const genreScore = calculateGenreScore(genresA, genresB);
  const songsScore = calculateSongsScore(songsA, songsB);
  const artistsScore = calculateArtistsScore(songsA, songsB);
  
  // Calcular puntuación global
  const overallScore = calculateOverallScore(genreScore, songsScore, artistsScore);
  
  // Encontrar elementos comunes
  const songIdsA = songsA.map(song => song.spotifyId || song.id || song);
  const songIdsB = songsB.map(song => song.spotifyId || song.id || song);
  const commonSongs = findCommonElements(songIdsA, songIdsB);
  const commonGenres = findCommonElements(genresA, genresB);
  
  // Determinar si son compatibles con el umbral predeterminado
  const isCompatible = areUsersCompatible(overallScore);
  
  // Retornar resultado detallado
  return {
    score: overallScore,
    isCompatible,
    matchDetails: {
      genreScore,
      songsScore,
      artistsScore,
      commonGenres,
      commonSongs
    }
  };
};

module.exports = {
  calculateMusicCompatibility,
  areUsersCompatible,
  jaccardSimilarity,
  findCommonElements,
  THRESHOLDS
}; 