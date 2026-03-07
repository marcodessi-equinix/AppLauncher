import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoritesController';

const router = express.Router();

router.get('/:clientId', getFavorites);
router.post('/', addFavorite);
router.delete('/:clientId/:linkId', removeFavorite);

export default router;
