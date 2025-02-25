const User = require('../models/User');
const Match = require('../models/Match');
const asyncHandler = require('../middleware/async');
const { calculateMusicCompatibility, THRESHOLDS } = require('../utils/matchingAlgorithm');

/**
 * @desc    Obtener un lote de perfiles para swipe
 * @route   GET /api/swipe/profiles
 * @access  Private
 */
exports.getSwipeProfiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10; // Número de perfiles a devolver

  // Obtener el usuario actual con sus preferencias musicales
  const currentUser = await User.findById(userId)
    .populate('musicPreferences.favoriteGenres')
    .populate('musicPreferences.favoriteSongs');

  if (!currentUser) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado'
    });
  }

  // Verificar si tiene preferencias musicales
  if (!currentUser.musicPreferences || 
      (!currentUser.musicPreferences.favoriteGenres.length && 
       !currentUser.musicPreferences.favoriteSongs.length)) {
    return res.status(400).json({
      success: false,
      error: 'Necesitas añadir preferencias musicales antes de descubrir perfiles'
    });
  }

  // Obtener IDs de perfiles que ya han tenido una acción de swipe (like o dislike)
  const existingMatches = await Match.find({
    $or: [
      { userA: userId },
      { userB: userId }
    ]
  });

  // Extraer IDs para excluir
  const excludeIds = existingMatches.map(match => {
    return match.userA.toString() === userId 
      ? match.userB.toString() 
      : match.userA.toString();
  });

  // Añadir el ID del usuario actual a la lista de exclusión
  excludeIds.push(userId);

  // Buscar perfiles potenciales que no hayan tenido acción de swipe
  const potentialProfiles = await User.find({
    _id: { $nin: excludeIds },
    // Opcionalmente, añadir más filtros (edad, ubicación, etc.)
  })
  .populate('musicPreferences.favoriteGenres')
  .populate('musicPreferences.favoriteSongs')
  .limit(limit);

  // Aplicar el algoritmo de compatibilidad y formatear datos para el cliente
  const profilesWithCompatibility = potentialProfiles.map(profile => {
    // Calcular compatibilidad musical
    const compatibility = calculateMusicCompatibility(currentUser, profile);

    return {
      id: profile._id,
      name: profile.name,
      age: profile.age,
      location: profile.location,
      bio: profile.bio,
      photos: profile.profilePhoto ? [profile.profilePhoto] : [],
      // Si hay fotos en la galería, añadirlas
      ...(profile.gallery && profile.gallery.length && { 
        photos: [profile.profilePhoto, ...profile.gallery].filter(Boolean)
      }),
      musicPreferences: {
        genres: profile.musicPreferences?.favoriteGenres || [],
        songs: profile.musicPreferences?.favoriteSongs.map(song => ({
          title: song.title,
          artist: song.artist,
          spotifyId: song.spotifyId
        })) || []
      },
      compatibilityScore: compatibility.score,
      commonGenres: compatibility.matchDetails.commonGenres,
      commonSongs: compatibility.matchDetails.commonSongs
    };
  });

  // Ordenar por puntuación de compatibilidad (mayor a menor)
  profilesWithCompatibility.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Devolver los perfiles
  res.status(200).json({
    success: true,
    count: profilesWithCompatibility.length,
    data: profilesWithCompatibility
  });
});

/**
 * @desc    Realizar acción de swipe (like/dislike)
 * @route   POST /api/swipe/action
 * @access  Private
 */
exports.swipeAction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { targetUserId, action } = req.body;

  // Validar que la acción sea 'like' o 'dislike'
  if (!['like', 'dislike'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'La acción debe ser like o dislike'
    });
  }

  // Validar que el targetUserId existe
  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      error: 'El ID del usuario objetivo es requerido'
    });
  }

  // Verificar que el usuario objetivo existe
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'El usuario objetivo no existe'
    });
  }

  // Ordenar IDs para consistencia (el menor primero)
  const [userA, userB] = [userId, targetUserId].sort();

  // Verificar si ya existe un match entre estos usuarios
  let match = await Match.findOne({
    userA,
    userB
  });

  // Obtener los usuarios completos para calcular compatibilidad
  const user = await User.findById(userId)
    .populate('musicPreferences.favoriteGenres')
    .populate('musicPreferences.favoriteSongs');
  
  const targetUserFull = await User.findById(targetUserId)
    .populate('musicPreferences.favoriteGenres')
    .populate('musicPreferences.favoriteSongs');
  
  // Calcular compatibilidad
  const compatibility = calculateMusicCompatibility(user, targetUserFull);

  if (!match) {
    // Crear nuevo match
    match = new Match({
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

  // Actualizar el estado según quién realiza la acción
  if (userId === userA.toString()) {
    match.status.userAStatus = action === 'like' ? 'accepted' : 'rejected';
  } else {
    match.status.userBStatus = action === 'like' ? 'accepted' : 'rejected';
  }

  // Guardar cambios
  await match.save();

  // Verificar si hay match mutuo
  const isMatch = match.status.userAStatus === 'accepted' && match.status.userBStatus === 'accepted';

  // Si es un like, enviar notificación al usuario objetivo
  if (action === 'like') {
    // Obtener el servicio de notificaciones
    const notificationService = req.app.get('notificationService');
    
    if (notificationService) {
      // Verificar preferencias de notificaciones del usuario objetivo
      if (targetUser.notificationPreferences?.likeNotifications !== false) {
        // Enviar notificación de like
        await notificationService.createLikeNotification(targetUserId, {
          likerName: user.name,
          likerId: userId,
          likerPhoto: user.profilePicture,
          compatibility: compatibility.score
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      matchId: match._id,
      action,
      isMatch,
      compatibilityScore: compatibility.score
    }
  });
});

/**
 * @desc    Obtener resumen de swipes del usuario
 * @route   GET /api/swipe/stats
 * @access  Private
 */
exports.getSwipeStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Contar likes/dislikes enviados
  const likesSent = await Match.countDocuments({
    $or: [
      { userA: userId, 'status.userAStatus': 'accepted' },
      { userB: userId, 'status.userBStatus': 'accepted' }
    ]
  });

  const dislikesSent = await Match.countDocuments({
    $or: [
      { userA: userId, 'status.userAStatus': 'rejected' },
      { userB: userId, 'status.userBStatus': 'rejected' }
    ]
  });

  // Contar likes recibidos
  const likesReceived = await Match.countDocuments({
    $or: [
      { userA: userId, 'status.userBStatus': 'accepted' },
      { userB: userId, 'status.userAStatus': 'accepted' }
    ]
  });

  // Contar matches mutuos
  const mutualMatches = await Match.countDocuments({
    $or: [
      { userA: userId },
      { userB: userId }
    ],
    isMatch: true
  });

  res.status(200).json({
    success: true,
    data: {
      likesSent,
      dislikesSent,
      likesReceived,
      mutualMatches,
      totalSwipes: likesSent + dislikesSent
    }
  });
}); 