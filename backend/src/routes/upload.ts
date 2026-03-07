import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/icons');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append timestamp to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'icon-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

router.post(['/', '/icon'], requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Path traversal check
    const resolvedPath = path.resolve(req.file.path);
    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Invalid file path' });
    }

    const fileUrl = `/uploads/icons/${req.file.filename}`;

    res.json({ 
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', requireAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const icons = files.filter(file => {
      // Basic check to only return actual icon files (prevent reading .gitkeep etc.)
      return ['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(path.extname(file).toLowerCase());
    }).map(file => ({
      url: `/uploads/icons/${file}`,
      filename: file
    }));
    res.json(icons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list icons' });
  }
});

export default router;
