const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Get all wallets
router.get('/', walletController.getAllWallets);

// Get wallet by ID
router.get('/:id', walletController.getWalletById);

// Add new wallet
router.post('/', walletController.addWallet);

// Update wallet
router.put('/:id', walletController.updateWallet);

// Delete wallet
router.delete('/:id', walletController.deleteWallet);

// Start trading for a wallet
router.post('/:id/start', walletController.startTrading);

// Stop trading for a wallet
router.post('/:id/stop', walletController.stopTrading);

// Get wallet balances
router.get('/:id/balances', walletController.getWalletBalances);

module.exports = router; 