import { Router } from 'express';
import { getSuggestions } from '../controllers/suggestion.controller.js';

const router = Router();

router.get('/suggestions', getSuggestions);

export default router;
