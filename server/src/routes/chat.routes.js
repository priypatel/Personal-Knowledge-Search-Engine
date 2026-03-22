import { Router } from 'express';
import { sendMessage } from '../controllers/chat.controller.js';

const router = Router();

router.post('/chat', sendMessage);

export default router;
