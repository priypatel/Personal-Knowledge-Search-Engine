import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  refresh,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/auth/register',        register);
router.post('/auth/login',           login);
router.post('/auth/logout',          logout);
router.post('/auth/refresh',         refresh);
router.get('/auth/me',               requireAuth, me);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password',  resetPassword);

export default router;
