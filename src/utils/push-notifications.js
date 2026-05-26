const User = require('../models/User');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

function isValidExpoPushToken(token) {
  return typeof token === 'string' && /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token.trim());
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function sendPushNotification(pushTokens, title, body, data = {}) {
  const rawTokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];
  const validTokens = [...new Set(rawTokens.map((token) => String(token || '').trim()).filter(isValidExpoPushToken))];
  const skipped = rawTokens.length - validTokens.length;

  if (!validTokens.length) {
    console.log('[push] No valid Expo push tokens found', { skipped });
    return { sent: 0, failed: 0, skipped };
  }

  let sent = 0;
  let failed = 0;

  for (const batch of chunk(validTokens, BATCH_SIZE)) {
    const messages = batch.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        failed += batch.length;
        console.error('[push] Expo push batch failed', { status: response.status, result });
        continue;
      }

      const tickets = Array.isArray(result.data) ? result.data : [];
      const batchFailed = tickets.filter((ticket) => ticket.status === 'error').length;
      sent += batch.length - batchFailed;
      failed += batchFailed;
      console.log('[push] Expo push batch sent', { attempted: batch.length, sent: batch.length - batchFailed, failed: batchFailed });
      if (batchFailed) console.error('[push] Expo ticket errors', tickets.filter((ticket) => ticket.status === 'error'));
    } catch (error) {
      failed += batch.length;
      console.error('[push] Expo push batch exception', error);
    }
  }

  return { sent, failed, skipped };
}

async function notifyAllUsers(title, body, data = {}) {
  const users = await User.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken');
  const tokens = users.map((user) => user.pushToken);
  const result = await sendPushNotification(tokens, title, body, data);
  console.log('[push] Broadcast complete', { title, totalUsersWithTokens: users.length, ...result });
  return result;
}

module.exports = { sendPushNotification, notifyAllUsers, isValidExpoPushToken };
