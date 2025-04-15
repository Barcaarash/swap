const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const tradingController = require('../controllers/tradingController');

// Get token price data (using PancakeSwap with DexScreener fallback)
router.get('/:tokenAddress', priceController.getTokenPriceData);

// Get token price data from DexScreener only
router.get('/dexscreener/:tokenAddress', priceController.getDexScreenerPriceData);

// Get token price data from PancakeSwap only
router.get('/pancakeswap/:tokenAddress', tradingController.getTokenPrice);

module.exports = router; 