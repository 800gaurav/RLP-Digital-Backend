require('dotenv').config();
const app = require('./app');
const { connectDb } = require('./utils/db');
const { ensureDefaultSettings } = require('./utils/settings');
const { validateEnv } = require('./config/env');

const env = validateEnv();

const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

async function start() {
  await connectDb();
  await ensureDefaultSettings();
  app.listen(env.port, () => {
    console.log(`RLP Backend running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
