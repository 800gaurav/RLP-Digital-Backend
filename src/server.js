require('dotenv').config();
const app = require('./app');
const { connectDb } = require('./utils/db');
const { ensureDefaultSettings } = require('./utils/settings');
const { ensureDefaultAdmin } = require('./utils/admin-bootstrap');
const { ensureUserIndexes } = require('./utils/user-indexes');
const { validateEnv } = require('./config/env');

const env = validateEnv();

const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

async function start() {
  await connectDb();
  await ensureUserIndexes();
  await ensureDefaultAdmin();
  await ensureDefaultSettings();
  const host = process.env.HOST || '0.0.0.0';
  app.listen(env.port, host, () => {
    const publicUrl = env.publicBaseUrl || `http://${host}:${env.port}`;
    console.log(`RLP Backend running on ${publicUrl}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
