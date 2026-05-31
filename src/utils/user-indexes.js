const User = require('../models/User');

async function ensureUserIndexes() {
  const indexes = await User.collection.indexes();
  const emailIndex = indexes.find((index) => index.name === 'email_1');

  if (emailIndex?.unique && !emailIndex.partialFilterExpression) {
    await User.collection.dropIndex('email_1');
    console.log('[db] Dropped legacy users.email_1 unique index');
  }

  await User.collection.createIndex(
    { email: 1 },
    {
      name: 'email_1',
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
    },
  );
}

module.exports = { ensureUserIndexes };
