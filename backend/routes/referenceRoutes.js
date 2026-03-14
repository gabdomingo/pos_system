import express from 'express';
import { getPhilippineAddressData } from '../data/phAddresses.js';

const router = express.Router();

router.get('/ph-addresses', (req, res) => {
  res.json(getPhilippineAddressData());
});

export default router;
