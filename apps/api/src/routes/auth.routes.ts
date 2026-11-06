import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  googleAuth,
  updateProfile,
  refreshToken,
  logout
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
