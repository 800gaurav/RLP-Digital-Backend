function getCurrentPeriodKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function syncPosterUsage(user) {
  const periodKey = getCurrentPeriodKey();
  if (user.posterDownloadsPeriodKey === periodKey) return false;
  user.posterDownloadsPeriodKey = periodKey;
  user.posterDownloadsUsed = 0;
  await user.save();
  return true;
}

async function getPosterUsage(user, monthlyLimit) {
  await syncPosterUsage(user);
  const used = Number(user.posterDownloadsUsed) || 0;
  const limit = Math.max(Number(monthlyLimit) || 0, 0);
  const remaining = Math.max(limit - used, 0);
  return {
    used,
    limit,
    remaining,
    periodKey: user.posterDownloadsPeriodKey || getCurrentPeriodKey(),
  };
}

async function consumePosterDownload(user, monthlyLimit) {
  const usage = await getPosterUsage(user, monthlyLimit);
  if (usage.remaining <= 0) {
    const error = new Error('Monthly poster download limit reached');
    error.status = 403;
    throw error;
  }
  user.posterDownloadsUsed = usage.used + 1;
  user.posterDownloadsPeriodKey = usage.periodKey;
  await user.save();
  return {
    used: user.posterDownloadsUsed,
    limit: usage.limit,
    remaining: Math.max(usage.limit - user.posterDownloadsUsed, 0),
  };
}

module.exports = {
  consumePosterDownload,
  getPosterUsage,
};
