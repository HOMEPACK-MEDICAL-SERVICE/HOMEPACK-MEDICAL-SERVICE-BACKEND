import express from 'express';
import { uploadFile } from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);

export default router;
