const fs = require('fs/promises');
const path = require('path');

function getSharp() {
  return require('sharp');
}

function getFfmpeg() {
  const ffmpeg = require('fluent-ffmpeg');
  const ffmpegPath = require('ffmpeg-static');
  const ffprobePath = require('ffprobe-static').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
  return ffmpeg;
}

function buildFileUrl(req, filePath, uploadRoot) {
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const relative = path.relative(uploadRoot, filePath).replace(/\\/g, '/');
  return `${baseUrl}/uploads/${relative}`;
}

function buildOutputPath(filePath, suffix, extension) {
  const parsed = path.parse(filePath);
  const candidate = path.join(parsed.dir, `${parsed.name}${suffix}${extension}`);
  if (candidate !== filePath) return candidate;
  return path.join(parsed.dir, `${parsed.name}-optimized${suffix}${extension}`);
}

async function safelyDelete(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (_error) {
    // Best-effort cleanup only.
  }
}

function collectFiles(req) {
  if (req.file) return [req.file];
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files).flat();
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  if (hours > 0) {
    return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':');
  }
  return [minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function ffprobe(filePath) {
  const ffmpeg = getFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

function transcodeVideo(inputPath, outputPath, options) {
  const ffmpeg = getFfmpeg();
  return new Promise((resolve, reject) => {
    let stderrOutput = '';
    ffmpeg(inputPath)
      .outputOptions([
        '-movflags +faststart',
        `-crf ${options.crf}`,
        `-preset ${options.preset}`,
        '-pix_fmt yuv420p',
        '-vf',
        `scale=${options.maxWidth}:${options.maxHeight}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
      ])
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(options.audioBitrate)
      .format('mp4')
      .on('end', resolve)
      .on('stderr', (line) => {
        stderrOutput += `${line}\n`;
      })
      .on('error', (error) => {
        if (stderrOutput.trim()) error.message = `${error.message}\n${stderrOutput.trim()}`;
        reject(error);
      })
      .save(outputPath);
  });
}

async function captureVideoThumbnail(inputPath, outputPath, timestamp = '00:00:01') {
  const ffmpeg = getFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '480x?',
      });
  });
}

async function optimizeImage(file, req, options) {
  const sharp = getSharp();
  const mainPath = buildOutputPath(file.path, '', '.webp');
  const thumbPath = buildOutputPath(file.path, '-thumb', '.webp');

  const mainImage = sharp(file.path, { animated: true }).rotate();
  await mainImage
    .resize({
      width: options.maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: options.quality, effort: 4 })
    .toFile(mainPath);

  await sharp(file.path, { animated: true })
    .rotate()
    .resize({
      width: options.thumbnailWidth,
      height: options.thumbnailHeight,
      withoutEnlargement: true,
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: options.thumbnailQuality, effort: 4 })
    .toFile(thumbPath);

  const mainStats = await fs.stat(mainPath);
  await safelyDelete(file.path);

  return {
    kind: 'image',
    imageUrl: buildFileUrl(req, mainPath, options.uploadRoot),
    thumbnailUrl: buildFileUrl(req, thumbPath, options.uploadRoot),
    videoUrl: '',
    duration: '',
    size: mainStats.size,
    mimeType: 'image/webp',
    storagePaths: [mainPath, thumbPath],
  };
}

async function optimizeVideo(file, req, options) {
  const sharp = getSharp();
  const mainPath = buildOutputPath(file.path, '', '.mp4');
  const tempThumbPath = buildOutputPath(file.path, '-thumb-temp', '.jpg');
  const thumbPath = buildOutputPath(file.path, '-thumb', '.webp');

  await transcodeVideo(file.path, mainPath, options);
  const metadata = await ffprobe(mainPath);
  const durationSeconds = Number(metadata?.format?.duration) || 0;

  await captureVideoThumbnail(mainPath, tempThumbPath, durationSeconds > 3 ? '00:00:02' : '00:00:01');
  await sharp(tempThumbPath)
    .resize({
      width: options.thumbnailWidth,
      height: options.thumbnailHeight,
      withoutEnlargement: true,
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: options.thumbnailQuality, effort: 4 })
    .toFile(thumbPath);

  const mainStats = await fs.stat(mainPath);
  await safelyDelete(file.path);
  await safelyDelete(tempThumbPath);

  return {
    kind: 'video',
    imageUrl: '',
    thumbnailUrl: buildFileUrl(req, thumbPath, options.uploadRoot),
    videoUrl: buildFileUrl(req, mainPath, options.uploadRoot),
    duration: formatDuration(durationSeconds),
    size: mainStats.size,
    mimeType: 'video/mp4',
    storagePaths: [mainPath, thumbPath],
  };
}

function isImage(file) {
  return file.mimetype?.startsWith('image/');
}

function isVideo(file) {
  return file.mimetype?.startsWith('video/');
}

function optimizeUploads(config = {}) {
  const imageOptions = {
    uploadRoot: config.uploadRoot,
    maxWidth: Number(process.env.UPLOAD_IMAGE_MAX_WIDTH) || 1600,
    quality: Number(process.env.UPLOAD_IMAGE_QUALITY) || 80,
    thumbnailWidth: Number(process.env.UPLOAD_THUMB_WIDTH) || 480,
    thumbnailHeight: Number(process.env.UPLOAD_THUMB_HEIGHT) || 480,
    thumbnailQuality: Number(process.env.UPLOAD_THUMB_QUALITY) || 72,
    ...config.image,
  };

  const videoOptions = {
    uploadRoot: config.uploadRoot,
    maxWidth: Number(process.env.UPLOAD_VIDEO_MAX_WIDTH) || 1280,
    maxHeight: Number(process.env.UPLOAD_VIDEO_MAX_HEIGHT) || 720,
    crf: Number(process.env.UPLOAD_VIDEO_CRF) || 27,
    preset: process.env.UPLOAD_VIDEO_PRESET || 'veryfast',
    audioBitrate: process.env.UPLOAD_VIDEO_AUDIO_BITRATE || '96k',
    thumbnailWidth: Number(process.env.UPLOAD_THUMB_WIDTH) || 480,
    thumbnailHeight: Number(process.env.UPLOAD_THUMB_HEIGHT) || 480,
    thumbnailQuality: Number(process.env.UPLOAD_THUMB_QUALITY) || 72,
    ...config.video,
  };

  return (req, _res, next) => {
    const files = collectFiles(req);
    req.processedMedia = {};

    Promise.all(files.map(async (file) => {
      let asset = null;
      if (isImage(file)) asset = await optimizeImage(file, req, imageOptions);
      if (isVideo(file)) asset = await optimizeVideo(file, req, videoOptions);
      if (!asset) return;

      const fieldName = file.fieldname || 'file';
      req.processedMedia[fieldName] = asset;
      req.processedMedia[file.filename] = asset;

      file.path = asset.kind === 'image'
        ? path.join(imageOptions.uploadRoot, asset.imageUrl.split('/uploads/')[1])
        : path.join(videoOptions.uploadRoot, asset.videoUrl.split('/uploads/')[1]);
      file.filename = path.basename(file.path);
      file.mimetype = asset.mimeType;
      file.size = asset.size;
    }))
      .then(() => next())
      .catch((error) => {
        if (error.code === 'MODULE_NOT_FOUND') {
          error.message = `${error.message}. Run "npm install" in RLP-Digital-Backend to enable media optimization.`;
        }
        next(error);
      });
  };
}

module.exports = { optimizeUploads };
