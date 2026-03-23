import { Router } from 'express';
import { sendMessage, getChats, searchChats, createChat, patchChat } from '../controllers/chat.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Chat management routes — require authentication
router.get('/chats', requireAuth, getChats);
router.get('/chats/search', requireAuth, searchChats);
router.post('/chats', requireAuth, createChat);
router.patch('/chats/:id', requireAuth, patchChat);

// Message sending — guests allowed (no DB save when unauthenticated)
router.post('/chat', optionalAuth, sendMessage);

export default router;
