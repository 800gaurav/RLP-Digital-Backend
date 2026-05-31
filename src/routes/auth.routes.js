const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { uploadRegisterMedia, uploadRoot } = require('../middleware/upload.middleware');
const { optimizeUploads } = require('../middleware/optimize-upload.middleware');
const { register, validateRegistration, login, refresh, logout, forgotPassword, verifyOtp, resetPassword } = require('../controllers/auth.controller');

const router = Router();

const registrationDetailsSchema = z.object({
  fullName: z.string().min(2),
  mobileNumber: z.string().regex(/^\d{10}$/),
  password: z.string().min(8),
  dob: z.coerce.date(),
  gender: z.enum(['Male', 'Female', 'Other']),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'Other']),
  voterId: z.string().regex(/^[A-Z0-9]{10}$/i),
  state: z.string().min(2),
  district: z.string().min(2),
  vidhansabha: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
});

const registerSchema = registrationDetailsSchema.extend({
  paymentUtr: z.string().regex(/^\d{12}$/),
});

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

router.post(
  '/register',
  uploadRegisterMedia.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'voterIdPhoto', maxCount: 1 },
  ]),
  optimizeUploads({ uploadRoot }),
  validate(registerSchema),
  register,
);
router.post('/validate-registration', validate(registrationDetailsSchema), validateRegistration);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.delete('/logout', logout);

module.exports = router;
