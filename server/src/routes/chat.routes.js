import { Router } from 'express';
import { sendMessage, getChats, createChat, patchChat } from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/chats', getChats);
router.post('/chats', createChat);
router.patch('/chats/:id', patchChat);
router.post('/chat', sendMessage);

export default router;
