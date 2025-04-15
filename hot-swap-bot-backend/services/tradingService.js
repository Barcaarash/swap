const { 
  swapBNBForTokens, 
  swapTokensForBNB, 
  getTokenPriceInBNB, 
  getBNBPriceInToken,
  getBNBBalance,
  getTokenBalance
} = require('../utils/blockchain');
const { getTokenPriceWithRetry } = require('../utils/dexScreener');
const walletService = require('./walletService');
const logger = require('../utils/logger');

/**
 * Buy tokens with BNB
 * @param {string} walletId - Wallet ID
 * @returns {Object} - Transaction result
 */
const buyTokens = async (walletId) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    if (!wallet.tokenAddress) {
      throw new Error('Token address not set for this wallet');
    }
    
    // Get private key
    const privateKey = walletService.getPrivateKeyForWallet(walletId);
    
    // Execute swap
    const receipt = await swapBNBForTokens(
      privateKey,
      wallet.tokenAddress,
      wallet.buyAmount || 0.01,
      wallet.slippageTolerance || 0.5
    );
    
    // Update wallet action
    walletService.updateWalletAction(walletId, 'buy');
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      message: `Successfully bought tokens for ${wallet.buyAmount} BNB`
    };
  } catch (error) {
    // Log error
    logger.error(`Buy tokens failed for wallet ${walletId}: ${error.message}`);
    
    // Update wallet error
    walletService.updateWalletError(walletId, `Buy failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sell tokens for BNB
 * @param {string} walletId - Wallet ID
 * @returns {Object} - Transaction result
 */
const sellTokens = async (walletId) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    if (!wallet.tokenAddress) {
      throw new Error('Token address not set for this wallet');
    }
    
    // Get private key
    const privateKey = walletService.getPrivateKeyForWallet(walletId);
    
    // Get token balance
    const tokenBalance = await getTokenBalance(wallet.address, wallet.tokenAddress);
    
    // Calculate sell amount based on percentage
    const sellPercentage = wallet.sellPercentage || 100;
    const sellAmount = parseFloat(tokenBalance) * (sellPercentage / 100);
    
    if (sellAmount <= 0) {
      throw new Error('Insufficient token balance to sell');
    }
    
    // Execute swap
    const receipt = await swapTokensForBNB(
      privateKey,
      wallet.tokenAddress,
      sellAmount.toString(),
      wallet.slippageTolerance || 0.5
    );
    
    // Update wallet action
    walletService.updateWalletAction(walletId, 'sell');
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      message: `Successfully sold ${sellAmount} tokens for BNB`
    };
  } catch (error) {
    // Log error
    logger.error(`Sell tokens failed for wallet ${walletId}: ${error.message}`);
    
    // Update wallet error
    walletService.updateWalletError(walletId, `Sell failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get token price with fallback mechanisms
 * @param {string} tokenAddress - Token address
 * @returns {Object} - Price data
 */
const getTokenPrice = async (tokenAddress) => {
  try {
    // Try using PancakeSwap getAmountsOut first
    const priceInBNB = await getTokenPriceInBNB(tokenAddress);
    const tokensPerBNB = await getBNBPriceInToken(tokenAddress);
    
    return {
      success: true,
      source: 'pancakeswap',
      data: {
        priceInBNB,
        tokensPerBNB
      }
    };
  } catch (error) {
    logger.warn(`PancakeSwap price fetch failed, trying DexScreener: ${error.message}`);
    
    // Fallback to DexScreener
    try {
      const dexScreenerData = await getTokenPriceWithRetry(tokenAddress);
      
      if (!dexScreenerData.success) {
        throw new Error('DexScreener scraping failed');
      }
      
      return {
        success: true,
        source: 'dexscreener',
        data: dexScreenerData.data
      };
    } catch (fallbackError) {
      logger.error(`All price fetching methods failed: ${fallbackError.message}`);
      
      return {
        success: false,
        error: 'Failed to fetch token price from all sources'
      };
    }
  }
};

/**
 * Get wallet trading data
 * @param {string} walletId - Wallet ID
 * @returns {Object} - Trading data
 */
const getWalletTradingData = async (walletId) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Get BNB balance
    const bnbBalance = await getBNBBalance(wallet.address);
    
    // Initialize result
    const result = {
      id: wallet.id,
      address: wallet.address,
      bnbBalance,
      tokenBalance: null,
      tokenPrice: null
    };
    
    // Get token data if available
    if (wallet.tokenAddress) {
      // Get token balance
      const tokenBalance = await getTokenBalance(wallet.address, wallet.tokenAddress);
      result.tokenBalance = tokenBalance;
      
      // Get token price
      try {
        const priceData = await getTokenPrice(wallet.tokenAddress);
        result.tokenPrice = priceData;
      } catch (priceError) {
        logger.error(`Failed to get token price: ${priceError.message}`);
        result.tokenPrice = { success: false, error: priceError.message };
      }
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error(`Failed to get wallet trading data: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Execute trading strategy for a wallet
 * @param {string} walletId - Wallet ID
 */
const executeWalletStrategy = async (walletId) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet || !wallet.active) {
      return { success: false, message: 'Wallet not found or not active' };
    }
    
    if (!wallet.tokenAddress) {
      walletService.updateWalletError(walletId, 'Token address not set');
      return { success: false, message: 'Token address not set' };
    }
    
    // Check strategy
    const { strategy } = wallet;
    
    switch (strategy) {
      case 'buy':
        logger.info(`Executing BUY strategy for wallet ${walletId}`);
        return await buyTokens(walletId);
        
      case 'sell':
        logger.info(`Executing SELL strategy for wallet ${walletId}`);
        return await sellTokens(walletId);
        
      case 'mixed':
        // Decide whether to buy or sell based on last action
        // If last action was sell or null, then buy. Otherwise, sell.
        if (!wallet.lastAction || wallet.lastAction === 'sell') {
          logger.info(`Executing mixed strategy (BUY) for wallet ${walletId}`);
          return await buyTokens(walletId);
        } else {
          logger.info(`Executing mixed strategy (SELL) for wallet ${walletId}`);
          return await sellTokens(walletId);
        }
        
      default:
        walletService.updateWalletError(walletId, `Unknown strategy: ${strategy}`);
        return { success: false, message: `Unknown strategy: ${strategy}` };
    }
  } catch (error) {
    logger.error(`Strategy execution failed for wallet ${walletId}: ${error.message}`);
    walletService.updateWalletError(walletId, `Strategy failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  buyTokens,
  sellTokens,
  getTokenPrice,
  getWalletTradingData,
  executeWalletStrategy
}; 