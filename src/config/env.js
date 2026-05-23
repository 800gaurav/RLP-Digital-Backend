const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    const weakSecrets = ['dev-access-secret-change-me', 'dev-refresh-secret-change-me', 'change-this-access-secret', 'change-this-refresh-secret'];
    ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
      if (weakSecrets.includes(process.env[key]) || process.env[key].length < 24) {
        throw new Error(`${key} must be a strong production secret`);
      }
    });
  }

  return {
    mongoUri: process.env.MONGODB_URI,
    port: process.env.PORT || 3000,
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    frontendUrl: process.env.FRONTEND_URL || '*',
  };
}

module.exports = { validateEnv };
