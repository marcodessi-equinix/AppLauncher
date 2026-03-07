import express from 'express';
import { registerClient } from '../controllers/clientController';

const router = express.Router();

router.post('/register', registerClient);

export default router;
