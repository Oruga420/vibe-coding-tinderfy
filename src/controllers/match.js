const Match = require('../models/Match');
const User = require('../models/User');
const { calculateMusicCompatibility, THRESHOLDS } = require('../utils/matchingAlgorithm');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Genera matches para un usuario
 * @route   GET /api/match/generate
 * @access  Private
 */
exports.generateMatches = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('musicPreferences.favoriteSongs')
    .populate('musicPreferences.favoriteGenres');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }

  // Verificar que el usuario tenga preferencias musicales
  if (!user.musicPreferences || 
      (!user.musicPreferences.favoriteGenres.length && 
       !user.musicPreferences.favoriteSongs.length)) {
    return res.status(400).json({
      success: false,
      error: 'Debes añadir preferencias musicales para generar matches'
    });
  }

  // Obtener todos los usuarios excepto el actual
  const potentialMatches = await User.find({
    _id: { $ne: user._id },
    // Opcional: filtros adicionales (edad, ubicación, etc.)
  }).populate('musicPreferences.favoriteSongs')
    .populate('musicPreferences.favoriteGenres');

  // Array para almacenar los matches calculados
  const calculatedMatches = [];
  
  // Para cada usuario potencial, calcular la compatibilidad
  for (const potentialMatch of potentialMatches) {
    // Calcular puntuación de compatibilidad
    const compatibility = calculateMusicCompatibility(user, potentialMatch);
    
    // Si supera el umbral mínimo, considerarlo como match
    if (compatibility.score >= THRESHOLDS.LOW_MATCH) {
      // Ordenar userA y userB para mantener consistencia (el menor ID primero)
      const [userA, userB] = [user._id, potentialMatch._id].sort();
      
      // Verificar si ya existe un match entre estos usuarios
      let match = await Match.findOne({
        userA,
        userB
      });
      
      if (match) {
        // Actualizar puntuación y detalles si el match ya existe
        match.score = compatibility.score;
        match.matchDetails = {
          commonSongs: compatibility.matchDetails.commonSongs,
          commonGenres: compatibility.matchDetails.commonGenres,
          genreScore: compatibility.matchDetails.genreScore,
          songsScore: compatibility.matchDetails.songsScore,
          artistsScore: compatibility.matchDetails.artistsScore
        };
        await match.save();
      } else {
        // Crear nuevo match
        match = await Match.create({
          userA,
          userB,
          score: compatibility.score,
          matchDetails: {
            commonSongs: compatibility.matchDetails.commonSongs,
            commonGenres: compatibility.matchDetails.commonGenres,
            genreScore: compatibility.matchDetails.genreScore,
            songsScore: compatibility.matchDetails.songsScore,
            artistsScore: compatibility.matchDetails.artistsScore
          }
        });
      }
      
      // Añadir información básica del usuario al resultado
      calculatedMatches.push({
        matchId: match._id,
        user: {
          id: potentialMatch._id,
          name: potentialMatch.name,
          photo: potentialMatch.profilePhoto,
          age: potentialMatch.age,
          bio: potentialMatch.bio
        },
        score: compatibility.score,
        commonGenres: compatibility.matchDetails.commonGenres,
        commonSongs: compatibility.matchDetails.commonSongs.length,
        status: user._id.toString() === userA.toString() 
          ? match.status.userAStatus 
          : match.status.userBStatus
      });
    }
  }
  
  // Ordenar por puntuación (mayor a menor)
  calculatedMatches.sort((a, b) => b.score - a.score);
  
  res.status(200).json({
    success: true,
    count: calculatedMatches.length,
    data: calculatedMatches
  });
});

/**
 * @desc    Obtener todos los matches del usuario
 * @route   GET /api/match
 * @access  Private
 */
exports.getMatches = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Buscar matches donde el usuario es userA o userB
  const matches = await Match.find({
    $or: [
      { userA: userId },
      { userB: userId }
    ]
  })
  .populate('userA', 'name profilePhoto age bio')
  .populate('userB', 'name profilePhoto age bio');
  
  // Transformar los resultados para el cliente
  const formattedMatches = matches.map(match => {
    // Determinar si el usuario logueado es userA o userB
    const isUserA = match.userA._id.toString() === userId;
    
    // Obtener el otro usuario
    const otherUser = isUserA ? match.userB : match.userA;
    
    // Obtener el estado del match para el usuario actual
    const userStatus = isUserA ? match.status.userAStatus : match.status.userBStatus;
    
    // Obtener el estado del match para el otro usuario
    const otherUserStatus = isUserA ? match.status.userBStatus : match.status.userAStatus;
    
    return {
      matchId: match._id,
      user: {
        id: otherUser._id,
        name: otherUser.name,
        photo: otherUser.profilePhoto,
        age: otherUser.age,
        bio: otherUser.bio
      },
      score: match.score,
      commonGenres: match.matchDetails.commonGenres,
      commonSongs: match.matchDetails.commonSongs.length,
      status: {
        user: userStatus,
        otherUser: otherUserStatus
      },
      isMatch: match.isMatch,
      createdAt: match.createdAt
    };
  });
  
  res.status(200).json({
    success: true,
    count: formattedMatches.length,
    data: formattedMatches
  });
});

/**
 * @desc    Obtener un match específico por ID
 * @route   GET /api/match/:id
 * @access  Private
 */
exports.getMatch = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const matchId = req.params.id;
  
  // Buscar el match por ID
  const match = await Match.findById(matchId)
    .populate('userA', 'name profilePhoto age bio musicPreferences')
    .populate('userB', 'name profilePhoto age bio musicPreferences');
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match no encontrado'
    });
  }
  
  // Verificar que el usuario sea parte del match
  if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'No estás autorizado para ver este match'
    });
  }
  
  // Determinar si el usuario logueado es userA o userB
  const isUserA = match.userA._id.toString() === userId;
  
  // Obtener el otro usuario
  const otherUser = isUserA ? match.userB : match.userA;
  
  // Formatear respuesta
  const formattedMatch = {
    matchId: match._id,
    user: {
      id: otherUser._id,
      name: otherUser.name,
      photo: otherUser.profilePhoto,
      age: otherUser.age,
      bio: otherUser.bio,
      musicPreferences: {
        genres: otherUser.musicPreferences?.favoriteGenres || [],
        songs: otherUser.musicPreferences?.favoriteSongs || []
      }
    },
    score: match.score,
    matchDetails: match.matchDetails,
    status: {
      user: isUserA ? match.status.userAStatus : match.status.userBStatus,
      otherUser: isUserA ? match.status.userBStatus : match.status.userAStatus
    },
    isMatch: match.isMatch,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt
  };
  
  res.status(200).json({
    success: true,
    data: formattedMatch
  });
});

/**
 * @desc    Actualizar estado de un match (aceptar/rechazar)
 * @route   PUT /api/match/:id/status
 * @access  Private
 */
exports.updateMatchStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const matchId = req.params.id;
  const { status } = req.body;
  
  // Validar el estado
  if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Estado inválido. Debe ser: pending, accepted o rejected'
    });
  }
  
  // Buscar el match por ID
  const match = await Match.findById(matchId);
  
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match no encontrado'
    });
  }
  
  // Verificar que el usuario sea parte del match
  if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'No estás autorizado para actualizar este match'
    });
  }
  
  // Actualizar el estado según el usuario
  const isUserA = match.userA.toString() === userId;
  const previousStatus = isUserA ? match.status.userAStatus : match.status.userBStatus;
  
  if (isUserA) {
    match.status.userAStatus = status;
  } else {
    match.status.userBStatus = status;
  }
  
  // Guardar los cambios
  await match.save();
  
  // Verificar si se ha creado un match mutuo (ambos aceptaron)
  const wasMatchBefore = match.isMatch;
  const isMatchNow = match.status.userAStatus === 'accepted' && match.status.userBStatus === 'accepted';
  
  // Si se acaba de crear un match mutuo, enviar notificación
  if (!wasMatchBefore && isMatchNow) {
    // Obtener información de los usuarios
    const [userA, userB] = await Promise.all([
      User.findById(match.userA, 'name profilePicture'),
      User.findById(match.userB, 'name profilePicture')
    ]);
    
    // Obtener el servicio de notificaciones
    const notificationService = req.app.get('notificationService');
    
    if (notificationService) {
      // Enviar notificación al otro usuario
      const otherUserId = isUserA ? match.userB : match.userA;
      const currentUser = isUserA ? userA : userB;
      const otherUser = isUserA ? userB : userA;
      
      // Verificar preferencias de notificaciones del otro usuario
      if (otherUser.notificationPreferences?.matchNotifications !== false) {
        await notificationService.createMatchNotification(otherUserId, {
          matchId: match._id,
          userName: currentUser.name,
          userPhoto: currentUser.profilePicture
        });
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      matchId: match._id,
      userStatus: isUserA ? match.status.userAStatus : match.status.userBStatus,
      otherUserStatus: isUserA ? match.status.userBStatus : match.status.userAStatus,
      isMatch: match.isMatch
    }
  });
});

/**
 * @desc    Obtener estadísticas de matches
 * @route   GET /api/match/stats
 * @access  Private
 */
exports.getMatchStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Contar matches por estado
  const totalMatches = await Match.countDocuments({
    $or: [
      { userA: userId },
      { userB: userId }
    ]
  });
  
  const pendingMatches = await Match.countDocuments({
    $or: [
      { userA: userId, 'status.userAStatus': 'pending' },
      { userB: userId, 'status.userBStatus': 'pending' }
    ]
  });
  
  const acceptedMatches = await Match.countDocuments({
    $or: [
      { userA: userId, 'status.userAStatus': 'accepted' },
      { userB: userId, 'status.userBStatus': 'accepted' }
    ]
  });
  
  const mutualMatches = await Match.countDocuments({
    $or: [
      { userA: userId },
      { userB: userId }
    ],
    isMatch: true
  });
  
  // Obtener match con mayor puntuación
  const topMatch = await Match.findOne({
    $or: [
      { userA: userId },
      { userB: userId }
    ]
  })
  .sort({ score: -1 })
  .populate('userA', 'name profilePhoto')
  .populate('userB', 'name profilePhoto');
  
  // Formatear estadísticas
  const stats = {
    totalMatches,
    pendingMatches,
    acceptedMatches,
    mutualMatches,
    topMatch: topMatch ? {
      matchId: topMatch._id,
      score: topMatch.score,
      user: topMatch.userA._id.toString() === userId 
        ? {
            id: topMatch.userB._id,
            name: topMatch.userB.name,
            photo: topMatch.userB.profilePhoto
          }
        : {
            id: topMatch.userA._id,
            name: topMatch.userA.name,
            photo: topMatch.userA.profilePhoto
          }
    } : null
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Obtener recomendaciones de canciones basadas en matches
 * @route   GET /api/match/recommendations
 * @access  Private
 */
exports.getMusicRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Buscar matches del usuario que hayan sido aceptados mutuamente
  const matches = await Match.find({
    $or: [
      { userA: userId },
      { userB: userId }
    ],
    isMatch: true
  })
  .populate('userA', 'musicPreferences.favoriteSongs')
  .populate('userB', 'musicPreferences.favoriteSongs');
  
  if (!matches.length) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }
  
  // Obtener las canciones de los matches
  const songRecommendations = new Map();
  
  matches.forEach(match => {
    // Determinar el otro usuario
    const otherUser = match.userA._id.toString() === userId ? match.userB : match.userA;
    
    // Añadir las canciones del otro usuario a las recomendaciones, si no son comunes
    const commonSongIds = new Set(match.matchDetails.commonSongs);
    
    otherUser.musicPreferences?.favoriteSongs.forEach(song => {
      const songId = song.spotifyId || song.id || song.toString();
      
      // Si la canción no está en las comunes y no ha sido recomendada ya
      if (!commonSongIds.has(songId) && !songRecommendations.has(songId)) {
        songRecommendations.set(songId, {
          song,
          score: match.score,
          matchId: match._id
        });
      }
    });
  });
  
  // Convertir las recomendaciones a un array y ordenarlas por puntuación
  const recommendations = [...songRecommendations.values()]
    .sort((a, b) => b.score - a.score)
    .map(rec => ({
      song: rec.song,
      matchScore: rec.score
    }));
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations
  });
}); 