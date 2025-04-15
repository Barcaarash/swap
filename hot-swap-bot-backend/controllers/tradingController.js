const tradingService = require('../services/tradingService');
const logger = require('../utils/logger');

/**
 * Buy tokens with BNB
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const buyTokens = async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Execute buy
    const result = await tradingService.buyTokens(walletId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`Buy tokens API error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sell tokens for BNB
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sellTokens = async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Execute sell
    const result = await tradingService.sellTokens(walletId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`Sell tokens API error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get token price
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTokenPrice = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    // Get price
    const result = await tradingService.getTokenPrice(tokenAddress);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`Get token price API error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get wallet trading data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getWalletTradingData = async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Get trading data
    const result = await tradingService.getWalletTradingData(walletId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`Get wallet trading data API error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Execute wallet strategy once
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const executeWalletStrategy = async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Execute strategy
    const result = await tradingService.executeWalletStrategy(walletId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    logger.error(`Execute wallet strategy API error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  buyTokens,
  sellTokens,
  getTokenPrice,
  getWalletTradingData,
  executeWalletStrategy
}; 