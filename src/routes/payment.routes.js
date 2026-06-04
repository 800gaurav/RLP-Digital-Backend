const { Router } = require('express');
const {
  getRegistrationPaymentStatus,
  handleUpiCallback,
  initiateRegistrationPayment,
} = require('../controllers/payment/upiPaymentGatway');

const router = Router();

router.post('/upi/initiate-registration', initiateRegistrationPayment);
router.get('/upi/status', getRegistrationPaymentStatus);
router.post('/upi/callback', handleUpiCallback);
router.get('/upi/callback', (req, res, next) => {
  if (!req.query.client_txn_id) return res.status(200).send('OK');
  return handleUpiCallback(req, res, next);
});

module.exports = router;
