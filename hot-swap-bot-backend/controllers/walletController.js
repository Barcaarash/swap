const walletService = require('../services/walletService');
const tradingScheduler = require('../services/tradingScheduler');
const logger = require('../utils/logger');

/**
 * Get all wallets
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllWallets = (req, res) => {
  try {
    const wallets = walletService.listWallets();
    res.status(200).json({ success: true, wallets });
  } catch (error) {
    logger.error(`Failed to get wallets: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get wallet by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getWalletById = (req, res) => {
  try {
    const { id } = req.params;
    const wallet = walletService.getWallet(id);
    res.status(200).json({ success: true, wallet });
  } catch (error) {
    logger.error(`Failed to get wallet: ${error.message}`);
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * Add new wallet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const addWallet = (req, res) => {
  try {
    const walletData = req.body;
    
    // Validate required fields
    if (!walletData.privateKey) {
      return res.status(400).json({ success: false, message: 'Private key is required' });
    }
    
    if (!walletData.tokenAddress) {
      return res.status(400).json({ success: false, message: 'Token address is required' });
    }
    
    // Add wallet
    const newWallet = walletService.addWallet(walletData);
    
    res.status(201).json({ success: true, wallet: newWallet });
  } catch (error) {
    logger.error(`Failed to add wallet: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update wallet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateWallet = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Update wallet
    const updatedWallet = walletService.updateWallet(id, updates);
    
    // Update scheduler if needed
    tradingScheduler.handleWalletUpdate(id);
    
    res.status(200).json({ success: true, wallet: updatedWallet });
  } catch (error) {
    logger.error(`Failed to update wallet: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete wallet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteWallet = (req, res) => {
  try {
    const { id } = req.params;
    
    // Stop trading for this wallet first
    tradingScheduler.stopWalletTrading(id);
    
    // Delete wallet
    walletService.deleteWallet(id);
    
    res.status(200).json({ success: true, message: 'Wallet deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete wallet: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start trading for a wallet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const startTrading = (req, res) => {
  try {
    const { id } = req.params;
    
    // Update wallet schedule
    const result = tradingScheduler.updateWalletSchedule(id, true);
    
    if (result.success) {
      res.status(200).json({ success: true, message: 'Trading started successfully' });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    logger.error(`Failed to start trading: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stop trading for a wallet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const stopTrading = (req, res) => {
  try {
    const { id } = req.params;
    
    // Update wallet schedule
    const result = tradingScheduler.updateWalletSchedule(id, false);
    
    if (result.success) {
      res.status(200).json({ success: true, message: 'Trading stopped successfully' });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    logger.error(`Failed to stop trading: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get wallet balances
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getWalletBalances = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get balances
    const balances = await walletService.getWalletBalances(id);
    
    res.status(200).json({ success: true, balances });
  } catch (error) {
    logger.error(`Failed to get wallet balances: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllWallets,
  getWalletById,
  addWallet,
  updateWallet,
  deleteWallet,
  startTrading,
  stopTrading,
  getWalletBalances
}; 