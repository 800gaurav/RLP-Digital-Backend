const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { uploadProfile } = require('../middleware/upload.middleware');
const { register, login, refresh, logout, forgotPassword, verifyOtp, resetPassword } = require('../controllers/auth.controller');

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  dob: z.coerce.date(),
  gender: z.enum(['Male', 'Female', 'Other']),
  voterId: z.string().min(6).max(20),
  address: z.string().min(3),
  state: z.string().min(2),
  district: z.string().min(2),
  city: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/register', uploadProfile.single('profilePhoto'), validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.delete('/logout', logout);

module.exports = router;
