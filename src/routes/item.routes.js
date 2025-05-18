import express from 'express';
import { createOrUpdateItem, getItems, getItemPrices, deleteItem, updateItem} from '../controllers/item.controller.js';

const router = express.Router();

router.post('/', createOrUpdateItem);

router.get('/', getItems);

router.get('/:id/prices', getItemPrices);

router.delete('/:id', deleteItem);

router.put('/:id', updateItem);

export default router;
