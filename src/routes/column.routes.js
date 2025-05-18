import { Router } from 'express';
import {
  getColumnSettings,
  updateColumnSetting
} from '../controllers/column.controller.js';

const router = Router();

router.get('/', getColumnSettings);
router.put('/:key', updateColumnSetting);

export default router;
