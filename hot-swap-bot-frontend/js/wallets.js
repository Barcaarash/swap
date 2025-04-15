/**
 * Wallet management module for Hot Swap Bot
 */
const Wallets = {
  /**
   * Initialize wallets module
   */
  async init() {
    console.log('Wallets module initialized');
    await this.loadWallets();
    
    // Set up refresh timer
    setInterval(() => this.refreshAllWallets(), 30000); // Refresh every 30 seconds
  },
  
  /**
   * Load wallets from API and render
   */
  async loadWallets() {
    try {
      const wallets = await API.getWallets();
      this.renderWalletsList(wallets);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      UI.showToast('Failed to load wallets', 'error');
    }
  },
  
  /**
   * Render wallets list
   * @param {Array} wallets - List of wallets
   */
  renderWalletsList(wallets) {
    const walletsContainer = document.getElementById('walletsContainer');
    const noWalletsMessage = document.getElementById('noWalletsMessage');
    
    // Clear container except for the "no wallets" message
    const children = Array.from(walletsContainer.children);
    children.forEach(child => {
      if (child !== noWalletsMessage) {
        child.remove();
      }
    });
    
    // Show/hide no wallets message
    if (wallets.length === 0) {
      noWalletsMessage.classList.remove('hidden');
    } else {
      noWalletsMessage.classList.add('hidden');
      
      // Render each wallet
      wallets.forEach(wallet => {
        const walletCard = this.createWalletCard(wallet);
        walletsContainer.appendChild(walletCard);
      });
    }
  },
  
  /**
   * Create wallet card element
   * @param {Object} wallet - Wallet data
   * @returns {HTMLElement} - Wallet card element
   */
  createWalletCard(wallet) {
    // Clone template
    const template = document.getElementById('walletCardTemplate');
    const walletCard = document.importNode(template.content, true).children[0];
    
    // Set wallet ID as data attribute
    walletCard.dataset.walletId = wallet.id;
    
    // Set wallet details
    walletCard.querySelector('.wallet-name').textContent = wallet.name || `Wallet ${UI.formatAddress(wallet.address)}`;
    walletCard.querySelector('.wallet-address').textContent = wallet.address;
    
    // Set status badge
    const statusBadge = walletCard.querySelector('.wallet-status-badge');
    statusBadge.textContent = wallet.active ? 'Active' : 'Idle';
    statusBadge.classList.toggle('active', wallet.active);
    
    // Set strategy badge
    const strategyBadge = walletCard.querySelector('.wallet-strategy-badge');
    strategyBadge.textContent = this.formatStrategy(wallet.strategy);
    strategyBadge.classList.add(wallet.strategy);
    
    // Set last action
    const lastAction = walletCard.querySelector('.last-action');
    lastAction.textContent = wallet.lastAction || 'None';
    
    // Set last update
    const lastUpdate = walletCard.querySelector('.last-update');
    lastUpdate.textContent = wallet.lastActionTime ? UI.formatRelativeTime(wallet.lastActionTime) : 'Never';
    
    // Show error if present
    if (wallet.lastError) {
      const errorContainer = walletCard.querySelector('.error-container');
      const errorMessage = walletCard.querySelector('.error-message');
      errorContainer.classList.remove('hidden');
      errorMessage.textContent = wallet.lastError;
    }
    
    // Show/hide start/stop buttons based on active status
    const startBtn = walletCard.querySelector('.start-trading-btn');
    const stopBtn = walletCard.querySelector('.stop-trading-btn');
    
    if (wallet.active) {
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      walletCard.classList.add('active');
    } else {
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      walletCard.classList.remove('active');
    }
    
    // Set up event listeners
    this.setupWalletCardEventListeners(walletCard, wallet);
    
    // Load trading data
    this.loadWalletTradingData(walletCard, wallet.id);
    
    return walletCard;
  },
  
  /**
   * Set up event listeners for wallet card
   * @param {HTMLElement} walletCard - Wallet card element
   * @param {Object} wallet - Wallet data
   */
  setupWalletCardEventListeners(walletCard, wallet) {
    const walletId = wallet.id;
    
    // Edit button
    walletCard.querySelector('.edit-wallet-btn').addEventListener('click', () => {
      this.showEditWalletModal(wallet);
    });
    
    // Delete button
    walletCard.querySelector('.delete-wallet-btn').addEventListener('click', () => {
      UI.showConfirmation(`Are you sure you want to delete wallet "${wallet.name || UI.formatAddress(wallet.address)}"?`, async () => {
        try {
          UI.showLoading();
          await this.deleteWallet(walletId);
          UI.showToast('Wallet deleted successfully', 'success');
        } catch (error) {
          UI.showToast(`Failed to delete wallet: ${error.message}`, 'error');
        } finally {
          UI.hideLoading();
        }
      });
    });
    
    // Start trading button
    walletCard.querySelector('.start-trading-btn').addEventListener('click', async () => {
      try {
        UI.addLoadingState(walletCard);
        await this.startTrading(walletId);
        UI.showToast('Trading started successfully', 'success');
      } catch (error) {
        UI.showToast(`Failed to start trading: ${error.message}`, 'error');
      } finally {
        UI.removeLoadingState(walletCard);
        await this.refreshWallet(walletId);
      }
    });
    
    // Stop trading button
    walletCard.querySelector('.stop-trading-btn').addEventListener('click', async () => {
      try {
        UI.addLoadingState(walletCard);
        await this.stopTrading(walletId);
        UI.showToast('Trading stopped successfully', 'success');
      } catch (error) {
        UI.showToast(`Failed to stop trading: ${error.message}`, 'error');
      } finally {
        UI.removeLoadingState(walletCard);
        await this.refreshWallet(walletId);
      }
    });
    
    // Buy now button
    walletCard.querySelector('.buy-now-btn').addEventListener('click', async () => {
      try {
        UI.addLoadingState(walletCard);
        const result = await Trading.buyTokens(walletId);
        if (result.success) {
          UI.showToast('Buy transaction successful', 'success');
        } else {
          UI.showToast(`Buy failed: ${result.error || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        UI.showToast(`Buy failed: ${error.message}`, 'error');
      } finally {
        UI.removeLoadingState(walletCard);
        await this.refreshWallet(walletId);
      }
    });
    
    // Sell now button
    walletCard.querySelector('.sell-now-btn').addEventListener('click', async () => {
      try {
        UI.addLoadingState(walletCard);
        const result = await Trading.sellTokens(walletId);
        if (result.success) {
          UI.showToast('Sell transaction successful', 'success');
        } else {
          UI.showToast(`Sell failed: ${result.error || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        UI.showToast(`Sell failed: ${error.message}`, 'error');
      } finally {
        UI.removeLoadingState(walletCard);
        await this.refreshWallet(walletId);
      }
    });
  },
  
  /**
   * Load wallet trading data (balances and price)
   * @param {HTMLElement} walletCard - Wallet card element
   * @param {string} walletId - Wallet ID
   */
  async loadWalletTradingData(walletCard, walletId) {
    try {
      const tradingData = await Trading.getWalletTradingData(walletId);
      
      if (!tradingData) return;
      
      // Update BNB balance
      const bnbBalance = walletCard.querySelector('.bnb-balance');
      bnbBalance.textContent = `${UI.formatNumber(tradingData.bnbBalance)} BNB`;
      
      // Update token balance
      const tokenBalance = walletCard.querySelector('.token-balance');
      tokenBalance.textContent = tradingData.tokenBalance ? UI.formatNumber(tradingData.tokenBalance) : '-';
      
      // Update token price
      const tokenPrice = walletCard.querySelector('.token-price');
      const tokenPriceSource = walletCard.querySelector('.token-price-source');
      
      if (tradingData.tokenPrice && tradingData.tokenPrice.success) {
        if (tradingData.tokenPrice.source === 'pancakeswap') {
          tokenPrice.textContent = `${UI.formatNumber(tradingData.tokenPrice.data.priceInBNB)} BNB`;
          tokenPriceSource.textContent = '(PancakeSwap)';
        } else if (tradingData.tokenPrice.source === 'dexscreener') {
          const priceUSD = tradingData.tokenPrice.data.data.priceUSD;
          tokenPrice.textContent = priceUSD ? UI.formatCurrency(priceUSD) : '-';
          tokenPriceSource.textContent = '(DexScreener)';
        }
      } else {
        tokenPrice.textContent = 'Failed to fetch';
        tokenPriceSource.textContent = '';
      }
    } catch (error) {
      console.error(`Failed to load trading data for wallet ${walletId}:`, error);
    }
  },
  
  /**
   * Show edit wallet modal
   * @param {Object} wallet - Wallet data
   */
  showEditWalletModal(wallet) {
    // Set form values
    document.getElementById('editWalletId').value = wallet.id;
    document.getElementById('editWalletName').value = wallet.name || '';
    document.getElementById('editTokenAddress').value = wallet.tokenAddress || '';
    document.getElementById('editStrategy').value = wallet.strategy || 'mixed';
    document.getElementById('editBuyAmount').value = wallet.buyAmount || 0.01;
    document.getElementById('editSellPercentage').value = wallet.sellPercentage || 100;
    document.getElementById('editSlippageTolerance').value = wallet.slippageTolerance || 0.5;
    document.getElementById('editInterval').value = (wallet.interval || 60000) / 1000; // Convert from ms to seconds
    
    // Show modal
    UI.showModal('editWalletModal');
  },
  
  /**
   * Format strategy name for display
   * @param {string} strategy - Strategy identifier
   * @returns {string} - Formatted strategy name
   */
  formatStrategy(strategy) {
    switch (strategy) {
      case 'buy': return 'Buy Only';
      case 'sell': return 'Sell Only';
      case 'mixed': return 'Mixed';
      default: return 'Unknown';
    }
  },
  
  /**
   * Add a new wallet
   * @param {Object} walletData - Wallet data
   * @returns {Promise<Object>} - Added wallet
   */
  async addWallet(walletData) {
    const wallet = await API.addWallet(walletData);
    await this.loadWallets();
    return wallet;
  },
  
  /**
   * Update a wallet
   * @param {string} walletId - Wallet ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated wallet
   */
  async updateWallet(walletId, updates) {
    const wallet = await API.updateWallet(walletId, updates);
    await this.refreshWallet(walletId);
    return wallet;
  },
  
  /**
   * Delete a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteWallet(walletId) {
    const result = await API.deleteWallet(walletId);
    await this.loadWallets();
    return result;
  },
  
  /**
   * Start trading for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async startTrading(walletId) {
    return await API.startTrading(walletId);
  },
  
  /**
   * Stop trading for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} - Response data
   */
  async stopTrading(walletId) {
    return await API.stopTrading(walletId);
  },
  
  /**
   * Refresh a specific wallet
   * @param {string} walletId - Wallet ID
   */
  async refreshWallet(walletId) {
    try {
      const wallet = await API.getWallet(walletId);
      
      // Find wallet card
      const walletCard = document.querySelector(`.wallet-card[data-wallet-id="${walletId}"]`);
      
      if (walletCard) {
        // Remove the old card
        walletCard.parentNode.replaceChild(this.createWalletCard(wallet), walletCard);
      }
    } catch (error) {
      console.error(`Failed to refresh wallet ${walletId}:`, error);
    }
  },
  
  /**
   * Refresh all wallets
   */
  async refreshAllWallets() {
    try {
      const wallets = await API.getWallets();
      
      // Update each wallet card
      wallets.forEach(wallet => {
        const walletCard = document.querySelector(`.wallet-card[data-wallet-id="${wallet.id}"]`);
        
        if (walletCard) {
          // Update trading data
          this.loadWalletTradingData(walletCard, wallet.id);
          
          // Update status
          const statusBadge = walletCard.querySelector('.wallet-status-badge');
          statusBadge.textContent = wallet.active ? 'Active' : 'Idle';
          statusBadge.classList.toggle('active', wallet.active);
          
          // Update last action
          walletCard.querySelector('.last-action').textContent = wallet.lastAction || 'None';
          
          // Update last update time
          walletCard.querySelector('.last-update').textContent = wallet.lastActionTime 
            ? UI.formatRelativeTime(wallet.lastActionTime) 
            : 'Never';
          
          // Update error if present
          const errorContainer = walletCard.querySelector('.error-container');
          const errorMessage = walletCard.querySelector('.error-message');
          
          if (wallet.lastError) {
            errorContainer.classList.remove('hidden');
            errorMessage.textContent = wallet.lastError;
          } else {
            errorContainer.classList.add('hidden');
          }
          
          // Update active state
          walletCard.classList.toggle('active', wallet.active);
          
          // Update start/stop buttons
          const startBtn = walletCard.querySelector('.start-trading-btn');
          const stopBtn = walletCard.querySelector('.stop-trading-btn');
          
          if (wallet.active) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
          } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
          }
        }
      });
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    }
  },
  
  /**
   * Get wallets from API
   * @returns {Promise<Array>} - List of wallets
   */
  async getWallets() {
    return await API.getWallets();
  }
}; 