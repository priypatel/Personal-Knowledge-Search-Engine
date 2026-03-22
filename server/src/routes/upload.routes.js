import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/upload.controller.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/upload', upload.single('file'), uploadDocument);

export default router;
