const cron = require('node-cron');
const walletService = require('./walletService');
const tradingService = require('./tradingService');
const logger = require('../utils/logger');

// Store active tasks by wallet ID
const activeTasks = new Map();

/**
 * Schedule trading for a wallet
 * @param {Object} wallet - Wallet object
 */
const scheduleWalletTrading = (wallet) => {
  if (!wallet.active) {
    // If wallet is not active, make sure it's not scheduled
    stopWalletTrading(wallet.id);
    return;
  }
  
  // If already scheduled, stop it first
  if (activeTasks.has(wallet.id)) {
    stopWalletTrading(wallet.id);
  }
  
  // Calculate cron expression based on interval (in ms)
  const intervalSeconds = Math.max(10, Math.floor((wallet.interval || 60000) / 1000));
  const cronExpression = `*/${intervalSeconds} * * * * *`;
  
  logger.info(`Scheduling trading for wallet ${wallet.id} with interval ${intervalSeconds}s`);
  
  try {
    // Schedule task
    const task = cron.schedule(cronExpression, async () => {
      try {
        logger.info(`Executing scheduled trading for wallet ${wallet.id}`);
        
        // Refetch wallet to get latest state
        const currentWallet = walletService.getWallet(wallet.id);
        
        // Skip if wallet is no longer active
        if (!currentWallet || !currentWallet.active) {
          logger.info(`Wallet ${wallet.id} is no longer active, skipping execution`);
          return;
        }
        
        // Execute trading strategy
        const result = await tradingService.executeWalletStrategy(wallet.id);
        
        if (!result.success) {
          logger.error(`Scheduled trading failed for wallet ${wallet.id}: ${result.error || result.message}`);
        }
      } catch (error) {
        logger.error(`Error in scheduled task for wallet ${wallet.id}: ${error.message}`);
        
        // Update wallet with error
        walletService.updateWalletError(wallet.id, `Schedule error: ${error.message}`);
      }
    });
    
    // Store task
    activeTasks.set(wallet.id, task);
    
    logger.info(`Trading scheduled for wallet ${wallet.id}`);
  } catch (error) {
    logger.error(`Failed to schedule trading for wallet ${wallet.id}: ${error.message}`);
    
    // Update wallet with error
    walletService.updateWalletError(wallet.id, `Scheduling failed: ${error.message}`);
  }
};

/**
 * Stop trading for a wallet
 * @param {string} walletId - Wallet ID
 */
const stopWalletTrading = (walletId) => {
  if (activeTasks.has(walletId)) {
    const task = activeTasks.get(walletId);
    task.stop();
    activeTasks.delete(walletId);
    
    logger.info(`Trading stopped for wallet ${walletId}`);
  }
};

/**
 * Initialize trading scheduler
 */
const initScheduler = () => {
  logger.info('Initializing trading scheduler');
  
  try {
    // Load wallets
    const wallets = walletService.listWallets();
    
    // Schedule active wallets
    wallets.forEach(wallet => {
      if (wallet.active) {
        scheduleWalletTrading(wallet);
      }
    });
    
    logger.info(`Scheduled trading for ${wallets.filter(w => w.active).length} active wallets`);
  } catch (error) {
    logger.error(`Failed to initialize scheduler: ${error.message}`);
  }
};

/**
 * Update wallet schedule
 * @param {string} walletId - Wallet ID
 * @param {boolean} active - Active status
 */
const updateWalletSchedule = (walletId, active) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Update wallet active status
    walletService.toggleWalletActive(walletId, active);
    
    // Get updated wallet
    const updatedWallet = walletService.getWallet(walletId);
    
    // Schedule or stop trading
    if (active) {
      scheduleWalletTrading(updatedWallet);
    } else {
      stopWalletTrading(walletId);
    }
    
    return {
      success: true,
      message: active ? 'Trading started' : 'Trading stopped'
    };
  } catch (error) {
    logger.error(`Failed to update wallet schedule: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle wallet update
 * @param {string} walletId - Wallet ID
 */
const handleWalletUpdate = (walletId) => {
  try {
    // Get wallet
    const wallet = walletService.getWallet(walletId);
    
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found`);
    }
    
    // Update schedule if active
    if (wallet.active) {
      scheduleWalletTrading(wallet);
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Failed to handle wallet update: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initScheduler,
  scheduleWalletTrading,
  stopWalletTrading,
  updateWalletSchedule,
  handleWalletUpdate
}; 