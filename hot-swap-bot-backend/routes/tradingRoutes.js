const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');

// Buy tokens with BNB
router.post('/buy/:walletId', tradingController.buyTokens);

// Sell tokens for BNB
router.post('/sell/:walletId', tradingController.sellTokens);

// Get wallet trading data
router.get('/data/:walletId', tradingController.getWalletTradingData);

// Execute wallet strategy once
router.post('/execute/:walletId', tradingController.executeWalletStrategy);

module.exports = router; 