function toSizeValue(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? size : 0;
}

function withMediaShape(data, overrides = {}) {
  return {
    ...data,
    imageUrl: overrides.imageUrl ?? data.imageUrl ?? '',
    thumbnailUrl: overrides.thumbnailUrl ?? data.thumbnailUrl ?? '',
    videoUrl: overrides.videoUrl ?? data.videoUrl ?? '',
    duration: overrides.duration ?? data.duration ?? '',
    size: overrides.size ?? toSizeValue(data.size),
  };
}

function serializeReel(item) {
  const data = item.toJSON ? item.toJSON() : item;
  const isVideo = data.mediaType === 'video';
  return withMediaShape(data, {
    imageUrl: isVideo ? (data.thumbnailUrl || '') : (data.imageUrl || data.mediaUrl || ''),
    thumbnailUrl: data.thumbnailUrl || (!isVideo ? data.mediaUrl || '' : ''),
    videoUrl: isVideo ? (data.videoUrl || data.mediaUrl || '') : '',
  });
}

function serializeTrainingVideo(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return withMediaShape(data, {
    imageUrl: data.imageUrl || '',
    thumbnailUrl: data.thumbnailUrl || data.imageUrl || '',
    videoUrl: data.videoUrl || '',
  });
}

function serializePosterTemplate(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return withMediaShape(data, {
    imageUrl: data.imageUrl || '',
    thumbnailUrl: data.thumbnailUrl || data.imageUrl || '',
    videoUrl: '',
  });
}

function serializeNotification(item) {
  const data = item.toJSON ? item.toJSON() : item;
  const isVideo = data.mediaType === 'video';
  const mediaUrl = data.mediaUrl || '';
  return withMediaShape(data, {
    imageUrl: isVideo ? '' : (data.imageUrl || mediaUrl),
    thumbnailUrl: data.thumbnailUrl || (!isVideo ? mediaUrl : ''),
    videoUrl: isVideo ? (data.videoUrl || mediaUrl) : '',
  });
}

function serializePadadhikari(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return withMediaShape(data, {
    imageUrl: data.imageUrl || data.photoUrl || '',
    thumbnailUrl: data.thumbnailUrl || data.photoUrl || '',
    videoUrl: '',
  });
}

function serializeUser(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return {
    ...data,
    profilePhoto: data.profilePhoto || '',
    profileThumbnailUrl: data.profileThumbnailUrl || data.profilePhoto || '',
    profilePhotoSize: toSizeValue(data.profilePhotoSize),
  };
}

module.exports = {
  serializeNotification,
  serializePadadhikari,
  serializePosterTemplate,
  serializeReel,
  serializeTrainingVideo,
  serializeUser,
};
