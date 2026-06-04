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
router.get('/upi/callback', handleUpiCallback);

module.exports = router;
