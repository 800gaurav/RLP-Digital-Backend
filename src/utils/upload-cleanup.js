const fs = require('fs/promises');
const path = require('path');

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

function extractUploadPath(value) {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(/\/uploads\/(.+)$/i);
  if (!match) return '';
  const relativePath = match[1].replace(/\//g, path.sep);
  const absolutePath = path.resolve(uploadRoot, relativePath);
  return absolutePath.startsWith(uploadRoot) ? absolutePath : '';
}

async function safelyDeleteUpload(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (_error) {
    // Best-effort cleanup only.
  }
}

function uniqueUploadPaths(values = []) {
  return [...new Set(values.map(extractUploadPath).filter(Boolean))];
}

async function deleteUploadFiles(values = []) {
  const paths = uniqueUploadPaths(values);
  await Promise.all(paths.map(safelyDeleteUpload));
}

async function deleteRemovedUploadFiles(previousValues = [], nextValues = []) {
  const previousPaths = uniqueUploadPaths(previousValues);
  const nextPathSet = new Set(uniqueUploadPaths(nextValues));
  const removedPaths = previousPaths.filter((filePath) => !nextPathSet.has(filePath));
  await Promise.all(removedPaths.map(safelyDeleteUpload));
}

module.exports = {
  deleteRemovedUploadFiles,
  deleteUploadFiles,
};
