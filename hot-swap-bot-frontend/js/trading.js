/**
 * Trading module for Hot Swap Bot
 */
const Trading = {
  /**
   * Initialize trading module
   */
  init() {
    console.log('Trading module initialized');
  },
  
  /**
   * Buy tokens
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - API response
   */
  async buyTokens(walletId) {
    try {
      return await API.buyTokens(walletId);
    } catch (error) {
      console.error(`Buy tokens failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Sell tokens
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - API response
   */
  async sellTokens(walletId) {
    try {
      return await API.sellTokens(walletId);
    } catch (error) {
      console.error(`Sell tokens failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get token price
   * @param {string} tokenAddress - Token address
   * @returns {Promise<Object>} - Price data
   */
  async getTokenPrice(tokenAddress) {
    try {
      return await API.getTokenPrice(tokenAddress);
    } catch (error) {
      console.error(`Get token price failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get wallet trading data
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Trading data
   */
  async getWalletTradingData(walletId) {
    try {
      return await API.getWalletTradingData(walletId);
    } catch (error) {
      console.error(`Get wallet trading data failed: ${error.message}`);
      return null;
    }
  },
  
  /**
   * Execute wallet strategy once
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - API response
   */
  async executeWalletStrategy(walletId) {
    try {
      return await API.executeWalletStrategy(walletId);
    } catch (error) {
      console.error(`Execute wallet strategy failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Format token price for display
   * @param {Object} priceData - Price data from API
   * @returns {string} - Formatted price
   */
  formatTokenPrice(priceData) {
    if (!priceData || !priceData.success) {
      return 'Failed to fetch';
    }
    
    if (priceData.source === 'pancakeswap') {
      const priceInBNB = priceData.data.priceInBNB;
      return `${parseFloat(priceInBNB).toFixed(6)} BNB`;
    } else if (priceData.source === 'dexscreener') {
      const priceUSD = priceData.data.data.priceUSD;
      return priceUSD ? `$${parseFloat(priceUSD).toFixed(6)}` : 'N/A';
    }
    
    return 'Unknown source';
  }
}; 