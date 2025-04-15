/**
 * Main entry point for Hot Swap Bot frontend
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modules
  UI.init();
  Wallets.init();
  Trading.init();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize dashboard
  updateDashboard();
  setInterval(updateDashboard, 60000); // Update dashboard every minute
});

/**
 * Set up main event listeners
 */
function setupEventListeners() {
  // Add wallet button
  document.getElementById('addWalletBtn').addEventListener('click', () => {
    UI.showModal('addWalletModal');
  });
  
  // Add wallet form submission
  document.getElementById('addWalletForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const walletData = {
      name: document.getElementById('walletName').value,
      privateKey: document.getElementById('privateKey').value,
      tokenAddress: document.getElementById('tokenAddress').value.trim(),
      strategy: document.getElementById('strategy').value,
      buyAmount: parseFloat(document.getElementById('buyAmount').value),
      sellPercentage: parseInt(document.getElementById('sellPercentage').value),
      slippageTolerance: parseFloat(document.getElementById('slippageTolerance').value),
      interval: parseInt(document.getElementById('interval').value) * 1000, // Convert to milliseconds
    };
    
    try {
      UI.showLoading();
      await Wallets.addWallet(walletData);
      UI.hideModal('addWalletModal');
      UI.showToast('Wallet added successfully', 'success');
      document.getElementById('addWalletForm').reset();
      updateDashboard();
    } catch (error) {
      UI.showToast(`Failed to add wallet: ${error.message}`, 'error');
    } finally {
      UI.hideLoading();
    }
  });
  
  // Edit wallet form submission
  document.getElementById('editWalletForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const walletId = document.getElementById('editWalletId').value;
    const updates = {
      name: document.getElementById('editWalletName').value,
      tokenAddress: document.getElementById('editTokenAddress').value.trim(),
      strategy: document.getElementById('editStrategy').value,
      buyAmount: parseFloat(document.getElementById('editBuyAmount').value),
      sellPercentage: parseInt(document.getElementById('editSellPercentage').value),
      slippageTolerance: parseFloat(document.getElementById('editSlippageTolerance').value),
      interval: parseInt(document.getElementById('editInterval').value) * 1000, // Convert to milliseconds
    };
    
    try {
      UI.showLoading();
      await Wallets.updateWallet(walletId, updates);
      UI.hideModal('editWalletModal');
      UI.showToast('Wallet updated successfully', 'success');
      updateDashboard();
    } catch (error) {
      UI.showToast(`Failed to update wallet: ${error.message}`, 'error');
    } finally {
      UI.hideLoading();
    }
  });
  
  // Close modals
  document.getElementById('closeAddWalletModal').addEventListener('click', () => {
    UI.hideModal('addWalletModal');
  });
  
  document.getElementById('cancelAddWallet').addEventListener('click', () => {
    UI.hideModal('addWalletModal');
  });
  
  document.getElementById('closeEditWalletModal').addEventListener('click', () => {
    UI.hideModal('editWalletModal');
  });
  
  document.getElementById('cancelEditWallet').addEventListener('click', () => {
    UI.hideModal('editWalletModal');
  });
  
  // Confirmation modal
  document.getElementById('cancelConfirmation').addEventListener('click', () => {
    UI.hideModal('confirmationModal');
  });
  
  // The confirm action button is handled dynamically when the modal is shown
}

/**
 * Update dashboard statistics
 */
async function updateDashboard() {
  try {
    const wallets = await Wallets.getWallets();
    const activeWallets = wallets.filter(wallet => wallet.active);
    
    // Update active wallets count
    document.getElementById('activeWalletsCount').textContent = activeWallets.length;
    
    // Update last update timestamp
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    // For transaction count, we'd need to keep track of successful trades
    // This is simplified for now
    document.getElementById('totalTransactions').textContent = wallets.reduce((count, wallet) => {
      return count + (wallet.lastAction ? 1 : 0);
    }, 0);
    
    // Update the wallet cards
    Wallets.refreshAllWallets();
  } catch (error) {
    console.error('Failed to update dashboard:', error);
    UI.showToast('Failed to update dashboard', 'error');
  }
} 