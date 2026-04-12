import express from 'express';
import { createLinkRequest, listLinkRequests, updateLinkRequest } from '../controllers/linkRequestController';
import { requireAdmin } from '../middleware/auth';
import { requireTrustedOrigin } from '../middleware/trustedOrigin';

const router = express.Router();

router.post('/', requireTrustedOrigin, createLinkRequest);
router.get('/admin', requireTrustedOrigin, requireAdmin, listLinkRequests);
router.patch('/admin/:id', requireTrustedOrigin, requireAdmin, updateLinkRequest);

export default router;