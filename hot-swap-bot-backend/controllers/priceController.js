const { getTokenPrice } = require('../services/tradingService');
const { getTokenPriceWithRetry } = require('../utils/dexScreener');
const logger = require('../utils/logger');

/**
 * Get token price data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTokenPriceData = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    // Get price data
    const priceData = await getTokenPrice(tokenAddress);
    
    if (priceData.success) {
      res.status(200).json(priceData);
    } else {
      res.status(500).json(priceData);
    }
  } catch (error) {
    logger.error(`Failed to get token price: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get token price data from DexScreener
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDexScreenerPriceData = async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    // Get price data from DexScreener
    const priceData = await getTokenPriceWithRetry(tokenAddress);
    
    if (priceData.success) {
      res.status(200).json(priceData);
    } else {
      res.status(500).json(priceData);
    }
  } catch (error) {
    logger.error(`Failed to get DexScreener price: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTokenPriceData,
  getDexScreenerPriceData
}; 