const fs = require('fs');
const path = require('path');

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

function toSizeValue(value) {
  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? size : 0;
}

function hasUsableFile(absolutePath) {
  try {
    const stats = fs.statSync(absolutePath);
    return stats.isFile() && stats.size > 0;
  } catch (_error) {
    return false;
  }
}

function sanitizeUploadUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(/\/uploads\/(.+)$/i);
  if (!match) return value;

  const relativePath = match[1].replace(/\//g, path.sep);
  const absolutePath = path.join(uploadRoot, relativePath);
  return hasUsableFile(absolutePath) ? value : '';
}

function withMediaShape(data, overrides = {}) {
  const imageUrl = sanitizeUploadUrl(overrides.imageUrl ?? data.imageUrl ?? '');
  const thumbnailUrl = sanitizeUploadUrl(overrides.thumbnailUrl ?? data.thumbnailUrl ?? '');
  const videoUrl = sanitizeUploadUrl(overrides.videoUrl ?? data.videoUrl ?? '');
  const mediaUrl = sanitizeUploadUrl(overrides.mediaUrl ?? data.mediaUrl ?? '') || videoUrl || imageUrl || thumbnailUrl;
  const photoUrl = sanitizeUploadUrl(overrides.photoUrl ?? data.photoUrl ?? '') || imageUrl || thumbnailUrl;

  return {
    ...data,
    photoUrl,
    mediaUrl,
    imageUrl,
    thumbnailUrl,
    videoUrl,
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
    mediaUrl: isVideo ? (data.videoUrl || data.mediaUrl || '') : (data.imageUrl || data.mediaUrl || data.thumbnailUrl || ''),
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
    mediaUrl: data.imageUrl || data.thumbnailUrl || '',
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
    mediaUrl: isVideo ? (data.videoUrl || mediaUrl) : (data.imageUrl || mediaUrl || data.thumbnailUrl || ''),
  });
}

function serializePadadhikari(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return withMediaShape(data, {
    imageUrl: data.imageUrl || data.photoUrl || '',
    thumbnailUrl: data.thumbnailUrl || data.photoUrl || '',
    mediaUrl: data.imageUrl || data.photoUrl || data.thumbnailUrl || '',
    photoUrl: data.photoUrl || data.imageUrl || '',
    videoUrl: '',
  });
}

function serializeUser(item) {
  const data = item.toJSON ? item.toJSON() : item;
  return {
    ...data,
    profilePhoto: sanitizeUploadUrl(data.profilePhoto || ''),
    profileThumbnailUrl: sanitizeUploadUrl(data.profileThumbnailUrl || data.profilePhoto || ''),
    profilePhotoSize: toSizeValue(data.profilePhotoSize),
    voterIdPhoto: sanitizeUploadUrl(data.voterIdPhoto || ''),
    voterIdThumbnailUrl: sanitizeUploadUrl(data.voterIdThumbnailUrl || data.voterIdPhoto || ''),
    voterIdPhotoSize: toSizeValue(data.voterIdPhotoSize),
  };
}

module.exports = {
  hasRenderableNotification: (item) => {
    const serialized = serializeNotification(item);
    return Boolean(serialized.videoUrl || serialized.imageUrl || serialized.thumbnailUrl || serialized.mediaUrl);
  },
  hasRenderableReel: (item) => {
    const serialized = serializeReel(item);
    return serialized.mediaType === 'video'
      ? Boolean(serialized.videoUrl && (serialized.thumbnailUrl || serialized.mediaUrl))
      : Boolean(serialized.imageUrl || serialized.thumbnailUrl || serialized.mediaUrl);
  },
  hasRenderableTrainingVideo: (item) => {
    const serialized = serializeTrainingVideo(item);
    return Boolean(serialized.videoUrl);
  },
  hasRenderablePosterTemplate: (item) => {
    const serialized = serializePosterTemplate(item);
    return Boolean(serialized.imageUrl || serialized.thumbnailUrl || serialized.mediaUrl);
  },
  serializeNotification,
  serializePadadhikari,
  serializePosterTemplate,
  serializeReel,
  serializeTrainingVideo,
  serializeUser,
};
