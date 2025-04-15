/**
 * API utility functions for Hot Swap Bot
 */
const API = {
  // Base API URL
  baseUrl: '/api',

  /**
   * Make a fetch request with error handling
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async fetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  /**
   * Get all wallets
   * @returns {Promise<Array>} - List of wallets
   */
  async getWallets() {
    const data = await this.fetch(`${this.baseUrl}/wallets`);
    return data.wallets || [];
  },

  /**
   * Get wallet by ID
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Wallet data
   */
  async getWallet(walletId) {
    const data = await this.fetch(`${this.baseUrl}/wallets/${walletId}`);
    return data.wallet;
  },

  /**
   * Add new wallet
   * @param {Object} walletData - Wallet data
   * @returns {Promise<Object>} - Created wallet
   */
  async addWallet(walletData) {
    const data = await this.fetch(`${this.baseUrl}/wallets`, {
      method: 'POST',
      body: JSON.stringify(walletData)
    });
    return data.wallet;
  },

  /**
   * Update wallet
   * @param {string} walletId - Wallet ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated wallet
   */
  async updateWallet(walletId, updates) {
    const data = await this.fetch(`${this.baseUrl}/wallets/${walletId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.wallet;
  },

  /**
   * Delete wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteWallet(walletId) {
    return await this.fetch(`${this.baseUrl}/wallets/${walletId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Start trading for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async startTrading(walletId) {
    return await this.fetch(`${this.baseUrl}/wallets/${walletId}/start`, {
      method: 'POST'
    });
  },

  /**
   * Stop trading for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async stopTrading(walletId) {
    return await this.fetch(`${this.baseUrl}/wallets/${walletId}/stop`, {
      method: 'POST'
    });
  },

  /**
   * Get wallet balances
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Balance data
   */
  async getWalletBalances(walletId) {
    const data = await this.fetch(`${this.baseUrl}/wallets/${walletId}/balances`);
    return data.balances;
  },

  /**
   * Buy tokens
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async buyTokens(walletId) {
    return await this.fetch(`${this.baseUrl}/trading/buy/${walletId}`, {
      method: 'POST'
    });
  },

  /**
   * Sell tokens
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async sellTokens(walletId) {
    return await this.fetch(`${this.baseUrl}/trading/sell/${walletId}`, {
      method: 'POST'
    });
  },

  /**
   * Get wallet trading data
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Trading data
   */
  async getWalletTradingData(walletId) {
    const data = await this.fetch(`${this.baseUrl}/trading/data/${walletId}`);
    return data.data;
  },

  /**
   * Execute wallet strategy once
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async executeWalletStrategy(walletId) {
    return await this.fetch(`${this.baseUrl}/trading/execute/${walletId}`, {
      method: 'POST'
    });
  },

  /**
   * Get token price
   * @param {string} tokenAddress - Token address
   * @returns {Promise<Object>} - Price data
   */
  async getTokenPrice(tokenAddress) {
    const data = await this.fetch(`${this.baseUrl}/price/${tokenAddress}`);
    return data;
  }
}; 