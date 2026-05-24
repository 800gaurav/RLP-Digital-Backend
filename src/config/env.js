const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function normalizeUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const publicBaseUrl = normalizeUrl(process.env.PUBLIC_BASE_URL);
  const frontendUrl = process.env.FRONTEND_URL || '*';
  const verifyBaseUrl = normalizeUrl(process.env.VERIFY_BASE_URL)
    || (publicBaseUrl ? `${publicBaseUrl}/api/verify` : '');

  if (nodeEnv === 'production') {
    const weakSecrets = ['dev-access-secret-change-me', 'dev-refresh-secret-change-me', 'change-this-access-secret', 'change-this-refresh-secret'];
    ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
      if (weakSecrets.includes(process.env[key]) || process.env[key].length < 24) {
        throw new Error(`${key} must be a strong production secret`);
      }
    });

    if (!publicBaseUrl) {
      throw new Error('PUBLIC_BASE_URL is required in production');
    }

    if (!frontendUrl || frontendUrl === '*') {
      throw new Error('FRONTEND_URL must be explicitly set in production');
    }
  }

  return {
    mongoUri: process.env.MONGODB_URI,
    port: process.env.PORT || 3000,
    nodeEnv,
    publicBaseUrl,
    verifyBaseUrl,
    frontendUrl,
  };
}

module.exports = { validateEnv };
