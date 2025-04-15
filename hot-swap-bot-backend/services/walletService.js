const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('../utils/encryption');
const { getWalletFromPrivateKey, getBNBBalance, getTokenBalance } = require('../utils/blockchain');
const logger = require('../utils/logger');

// Path to wallet config file
const WALLET_CONFIG_PATH = path.join(__dirname, '../../config/wallets.json');

// Default wallet config
const DEFAULT_WALLET_CONFIG = {
  wallets: []
};

/**
 * Initialize wallet storage
 */
const initWalletStorage = () => {
  try {
    if (!fs.existsSync(WALLET_CONFIG_PATH)) {
      fs.writeFileSync(WALLET_CONFIG_PATH, JSON.stringify(DEFAULT_WALLET_CONFIG, null, 2));
      logger.info('Wallet config file created');
    }
  } catch (error) {
    logger.error(`Failed to initialize wallet storage: ${error.message}`);
    throw error;
  }
};

/**
 * Load wallets from config
 * @returns {Array} - List of wallets
 */
const loadWallets = () => {
  try {
    initWalletStorage();
    const data = fs.readFileSync(WALLET_CONFIG_PATH, 'utf8');
    return JSON.parse(data).wallets || [];
  } catch (error) {
    logger.error(`Failed to load wallets: ${error.message}`);
    return [];
  }
};

/**
 * Save wallets to config
 * @param {Array} wallets - List of wallets to save
 */
const saveWallets = (wallets) => {
  try {
    const config = { wallets };
    fs.writeFileSync(WALLET_CONFIG_PATH, JSON.stringify(config, null, 2));
    logger.info('Wallets saved to config file');
  } catch (error) {
    logger.error(`Failed to save wallets: ${error.message}`);
    throw error;
  }
};

/**
 * Add a new wallet
 * @param {Object} walletData - Wallet data
 * @returns {Object} - Added wallet (without private key)
 */
const addWallet = (walletData) => {
  try {
    // Validate private key by creating wallet
    const wallet = getWalletFromPrivateKey(walletData.privateKey);
    
    // Encrypt private key
    const encryptedPrivateKey = encrypt(walletData.privateKey);
    
    // Create wallet object
    const newWallet = {
      id: Date.now().toString(),
      name: walletData.name || `Wallet ${wallet.address.slice(0, 6)}`,
      address: wallet.address,
      encryptedPrivateKey,
      tokenAddress: walletData.tokenAddress,
      active: false,
      strategy: walletData.strategy || 'mixed',
      slippageTolerance: walletData.slippageTolerance || 0.5,
      buyAmount: walletData.buyAmount || 0.01,
      sellPercentage: walletData.sellPercentage || 100,
      interval: walletData.interval || 60000, // Default: 1 minute
      lastAction: null,
      lastError: null,
      createdAt: new Date().toISOString()
    };
    
    // Load existing wallets
    const wallets = loadWallets();
    
    // Add new wallet
    wallets.push(newWallet);
    
    // Save wallets
    saveWallets(wallets);
    
    // Return wallet without private key
    const { encryptedPrivateKey: omit, ...safeWallet } = newWallet;
    return safeWallet;
  } catch (error) {
    logger.error(`Failed to add wallet: ${error.message}`);
    throw error;
  }
};

/**
 * Update wallet data
 * @param {string} walletId - Wallet ID
 * @param {Object} updates - Data to update
 * @returns {Object} - Updated wallet (without private key)
 */
const updateWallet = (walletId, updates) => {
  try {
    // Load wallets
    const wallets = loadWallets();
    
    // Find wallet index
    const walletIndex = wallets.findIndex(w => w.id === walletId);
    
    if (walletIndex === -1) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Get the wallet
    const wallet = wallets[walletIndex];
    
    // Update wallet (except for encrypted private key)
    const { encryptedPrivateKey, privateKey, ...safeUpdates } = updates;
    
    // If new private key is provided, encrypt it
    if (privateKey) {
      // Validate by creating wallet
      getWalletFromPrivateKey(privateKey);
      
      // Encrypt and update
      wallet.encryptedPrivateKey = encrypt(privateKey);
    }
    
    // Update other fields
    Object.assign(wallet, safeUpdates);
    
    // Update timestamp
    wallet.updatedAt = new Date().toISOString();
    
    // Save wallets
    saveWallets(wallets);
    
    // Return updated wallet without private key
    const { encryptedPrivateKey: omit, ...safeWallet } = wallet;
    return safeWallet;
  } catch (error) {
    logger.error(`Failed to update wallet: ${error.message}`);
    throw error;
  }
};

/**
 * Get wallet by ID
 * @param {string} walletId - Wallet ID
 * @returns {Object} - Wallet data (without private key)
 */
const getWallet = (walletId) => {
  try {
    // Load wallets
    const wallets = loadWallets();
    
    // Find wallet
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Return wallet without private key
    const { encryptedPrivateKey, ...safeWallet } = wallet;
    return safeWallet;
  } catch (error) {
    logger.error(`Failed to get wallet: ${error.message}`);
    throw error;
  }
};

/**
 * List all wallets
 * @returns {Array} - List of wallets (without private keys)
 */
const listWallets = () => {
  try {
    // Load wallets
    const wallets = loadWallets();
    
    // Remove private keys
    return wallets.map(wallet => {
      const { encryptedPrivateKey, ...safeWallet } = wallet;
      return safeWallet;
    });
  } catch (error) {
    logger.error(`Failed to list wallets: ${error.message}`);
    throw error;
  }
};

/**
 * Delete wallet
 * @param {string} walletId - Wallet ID
 * @returns {boolean} - Success status
 */
const deleteWallet = (walletId) => {
  try {
    // Load wallets
    const wallets = loadWallets();
    
    // Find wallet index
    const walletIndex = wallets.findIndex(w => w.id === walletId);
    
    if (walletIndex === -1) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Remove wallet
    wallets.splice(walletIndex, 1);
    
    // Save wallets
    saveWallets(wallets);
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete wallet: ${error.message}`);
    throw error;
  }
};

/**
 * Get private key from encrypted storage
 * @param {string} walletId - Wallet ID
 * @returns {string} - Decrypted private key
 */
const getPrivateKeyForWallet = (walletId) => {
  try {
    // Load wallets
    const wallets = loadWallets();
    
    // Find wallet
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Decrypt private key
    return decrypt(wallet.encryptedPrivateKey);
  } catch (error) {
    logger.error(`Failed to get private key: ${error.message}`);
    throw error;
  }
};

/**
 * Toggle wallet active status
 * @param {string} walletId - Wallet ID
 * @param {boolean} active - Active status
 * @returns {Object} - Updated wallet (without private key)
 */
const toggleWalletActive = (walletId, active) => {
  try {
    return updateWallet(walletId, { active });
  } catch (error) {
    logger.error(`Failed to toggle wallet active status: ${error.message}`);
    throw error;
  }
};

/**
 * Update wallet with an error
 * @param {string} walletId - Wallet ID
 * @param {string} errorMessage - Error message
 */
const updateWalletError = (walletId, errorMessage) => {
  try {
    updateWallet(walletId, { 
      lastError: errorMessage,
      lastErrorTime: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to update wallet error: ${error.message}`);
  }
};

/**
 * Update wallet with action timestamp
 * @param {string} walletId - Wallet ID
 * @param {string} action - Action performed
 */
const updateWalletAction = (walletId, action) => {
  try {
    updateWallet(walletId, { 
      lastAction: action,
      lastActionTime: new Date().toISOString(),
      lastError: null
    });
  } catch (error) {
    logger.error(`Failed to update wallet action: ${error.message}`);
  }
};

/**
 * Get wallet balances (BNB and token)
 * @param {string} walletId - Wallet ID
 * @returns {Object} - Balances object
 */
const getWalletBalances = async (walletId) => {
  try {
    // Get wallet
    const wallet = getWallet(walletId);
    
    // Get BNB balance
    const bnbBalance = await getBNBBalance(wallet.address);
    
    // Get token balance if token address is set
    let tokenBalance = null;
    if (wallet.tokenAddress) {
      tokenBalance = await getTokenBalance(wallet.address, wallet.tokenAddress);
    }
    
    return {
      bnbBalance,
      tokenBalance
    };
  } catch (error) {
    logger.error(`Failed to get wallet balances: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initWalletStorage,
  loadWallets,
  addWallet,
  updateWallet,
  getWallet,
  listWallets,
  deleteWallet,
  getPrivateKeyForWallet,
  toggleWalletActive,
  updateWalletError,
  updateWalletAction,
  getWalletBalances
}; 