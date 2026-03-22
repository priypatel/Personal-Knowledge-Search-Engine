import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', requireAuth, logout);
router.get('/auth/me', requireAuth, me);

export default router;
