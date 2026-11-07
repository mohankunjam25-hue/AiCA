import { Router } from 'express';
import {
  toggleFollowDeveloper,
  getDeveloperProfile,
  getDeveloperDirectory
} from '../controllers/developer.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Developer search & directory listing (with optional viewer authentication)
router.get('/', optionalAuth, getDeveloperDirectory);

// Full developer portfolio with follow-gated code protection
router.get('/:username', optionalAuth, getDeveloperProfile);

// Toggle follow/unfollow developer (requires authentication)
router.post('/:targetUserId/follow', authenticateToken, toggleFollowDeveloper);

export default router;
