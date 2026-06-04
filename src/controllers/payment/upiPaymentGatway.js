const axios = require('axios');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const { serializeUser } = require('../../utils/media-response');

const DEFAULT_ORDER_URL = 'https://api.upigateway.com/v1/order/create';
const SUCCESS_STATUSES = new Set(['success', 'successful', 'paid', 'completed']);
const FAILED_STATUSES = new Set(['failure', 'failed', 'cancelled', 'canceled', 'expired']);

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function isGatewayAccepted(data) {
  if (!data) return false;
  if (data.status === true) return true;
  const status = normalizeStatus(data.status);
  return ['true', 'success', 'successful'].includes(status);
}

function getGatewayConfig() {
  const apiKey = process.env.UPI_GATEWAY_API_KEY || process.env.UPIGATEWAY_API_KEY;
  const orderUrl = process.env.UPI_GATEWAY_ORDER_URL || DEFAULT_ORDER_URL;
  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const callbackUrl = process.env.UPI_GATEWAY_CALLBACK_URL
    || (publicBaseUrl ? `${publicBaseUrl}/api/payments/upi/callback` : '');
  const redirectUrl = process.env.UPI_GATEWAY_REDIRECT_URL
    || process.env.FRONTEND_PAYMENT_SUCCESS_URL
    || callbackUrl;

  return { apiKey, orderUrl, callbackUrl, redirectUrl };
}

function buildClientTxnId(user) {
  const userId = String(user._id).slice(-8);
  return `RLP${Date.now()}${userId}`.slice(0, 40);
}

async function markPaymentSuccess(user, body) {
  user.paymentStatus = 'approved';
  user.subscriptionStatus = 'active';
  user.paymentGatewayStatus = normalizeStatus(body.status) || 'success';
  user.paymentGatewayResponse = body;
  user.paymentUtr = body.upi_txn_id || body.utr || body.txn_id || user.paymentUtr || '';
  user.paymentReviewedAt = new Date();
  if (!user.subscriptionStartDate) user.subscriptionStartDate = new Date();
  user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  return user;
}

async function markPaymentFailed(user, body) {
  user.paymentStatus = 'rejected';
  user.subscriptionStatus = 'inactive';
  user.paymentGatewayStatus = normalizeStatus(body.status) || 'failed';
  user.paymentGatewayResponse = body;
  await user.save();
  return user;
}

const initiateRegistrationPayment = asyncHandler(async (req, res) => {
  const { apiKey, orderUrl, callbackUrl, redirectUrl } = getGatewayConfig();
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'UPI gateway API key missing in backend env' });
  }
  if (!callbackUrl) {
    return res.status(500).json({ success: false, message: 'PUBLIC_BASE_URL or UPI_GATEWAY_CALLBACK_URL is required for payment callback' });
  }

  const mobileNumber = String(req.body.mobileNumber || '').trim();
  const voterId = String(req.body.voterId || '').toUpperCase().trim();
  if (!mobileNumber && !voterId) {
    return res.status(400).json({ success: false, message: 'Mobile number or voter ID required' });
  }

  const user = await User.findOne({
    $or: [
      mobileNumber ? { mobileNumber } : null,
      voterId ? { voterId } : null,
    ].filter(Boolean),
  });
  if (!user) return res.status(404).json({ success: false, message: 'Registered user not found' });
  if (user.paymentStatus === 'approved') {
    return res.json({ success: true, data: { alreadyPaid: true, user: serializeUser(user) } });
  }

  const amount = Number(req.body.amount || user.paymentAmount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid payment amount required' });
  }

  const clientTxnId = req.body.client_txn_id || buildClientTxnId(user);
  const payload = {
    key: apiKey,
    client_txn_id: clientTxnId,
    amount: amount.toFixed(2),
    p_info: 'RLP Digital Subscription',
    customer_name: user.fullName,
    customer_email: user.email || `${user.mobileNumber}@rlp.local`,
    customer_mobile: user.mobileNumber,
    redirect_url: redirectUrl,
    callback_url: callbackUrl,
  };

  const gatewayResponse = await axios.post(orderUrl, payload, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  const gatewayData = gatewayResponse.data;
  if (!isGatewayAccepted(gatewayData)) {
    return res.status(502).json({
      success: false,
      message: gatewayData?.message || 'Payment initiation failed',
      data: gatewayData,
    });
  }

  user.paymentStatus = 'under_review';
  user.subscriptionStatus = 'inactive';
  user.paymentAmount = amount;
  user.paymentClientTxnId = clientTxnId;
  user.paymentGatewayStatus = 'initiated';
  user.paymentGatewayResponse = gatewayData;
  await user.save();

  res.json({
    success: true,
    data: {
      client_txn_id: clientTxnId,
      amount,
      user: serializeUser(user),
      gateway: gatewayData,
      payment_url: gatewayData?.data?.payment_url || gatewayData?.data?.upi_url || gatewayData?.payment_url || gatewayData?.upi_url || '',
      upi_url: gatewayData?.data?.upi_url || gatewayData?.upi_url || gatewayData?.data?.payment_url || gatewayData?.payment_url || '',
    },
  });
});

const handleUpiCallback = asyncHandler(async (req, res) => {
  const body = { ...req.query, ...req.body };
  const clientTxnId = body.client_txn_id || body.clientTxnId || body.order_id;
  if (!clientTxnId) return res.status(400).send('client_txn_id required');

  const user = await User.findOne({ paymentClientTxnId: clientTxnId });
  if (!user) return res.status(404).send('User not found for transaction');

  const status = normalizeStatus(body.status);
  if (SUCCESS_STATUSES.has(status)) {
    await markPaymentSuccess(user, body);
  } else if (FAILED_STATUSES.has(status)) {
    await markPaymentFailed(user, body);
  } else {
    user.paymentGatewayStatus = status || 'callback_received';
    user.paymentGatewayResponse = body;
    await user.save();
  }

  res.status(200).send('Webhook Processed Successfully');
});

const getRegistrationPaymentStatus = asyncHandler(async (req, res) => {
  const clientTxnId = String(req.query.client_txn_id || req.query.clientTxnId || '').trim();
  const mobileNumber = String(req.query.mobileNumber || '').trim();
  const voterId = String(req.query.voterId || '').toUpperCase().trim();
  const filter = clientTxnId
    ? { paymentClientTxnId: clientTxnId }
    : { $or: [mobileNumber ? { mobileNumber } : null, voterId ? { voterId } : null].filter(Boolean) };

  if (!clientTxnId && !mobileNumber && !voterId) {
    return res.status(400).json({ success: false, message: 'Transaction ID, mobile number or voter ID required' });
  }

  const user = await User.findOne(filter);
  if (!user) return res.status(404).json({ success: false, message: 'Payment user not found' });

  res.json({
    success: true,
    data: {
      paymentStatus: user.paymentStatus,
      subscriptionStatus: user.subscriptionStatus,
      paymentGatewayStatus: user.paymentGatewayStatus,
      client_txn_id: user.paymentClientTxnId,
      user: serializeUser(user),
    },
  });
});

module.exports = {
  initiateRegistrationPayment,
  handleUpiCallback,
  getRegistrationPaymentStatus,
};
