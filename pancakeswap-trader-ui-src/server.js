const express = require('express');
const path = require('path');
const { ethers } = require('ethers');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 4052;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for wallets and bot state
const wallets = [];
const botIntervals = {};
let botConfig = {
  tokenAddress: '',
  usdAmount: '10',
  slippage: '1',
  interval: '5',
  mode: 'buy' // 'buy', 'sell', or 'both'
};

// Price cache
let priceCache = {
  bnb: { price: 0, lastUpdated: 0 },
  tokens: {} // Format: { tokenAddress: { price: 0, lastUpdated: 0 } }
};

// PancakeSwap Router v2 contract address and ABI
const PANCAKESWAP_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// WBNB address
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// BNB Smart Chain RPC
const BSC_RPC = 'https://bsc-dataseed1.binance.org/';
const provider = new ethers.providers.JsonRpcProvider(BSC_RPC);

// ERC20 Token ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

// Function to get BNB price in USD
async function getBnbPriceUsd() {
  // Check if we have a recent cache (less than 5 minutes old)
  const now = Date.now();
  if (priceCache.bnb.price > 0 && (now - priceCache.bnb.lastUpdated) < 5 * 60 * 1000) {
    return priceCache.bnb.price;
  }
  
  return new Promise((resolve, reject) => {
    // Use local CoinGecko service instead of calling CoinGecko directly
    const url = 'http://localhost:4053/api/bnb-price';
    
    const request = http.get(url, (resp) => {
      // Check for valid response status code
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        return reject(new Error(`Status Code: ${resp.statusCode}`));
      }
      
      let data = '';
      
      resp.on('data', (chunk) => {
        data += chunk;
      });
      
      resp.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response && response.success && response.price) {
            const price = parseFloat(response.price);
            console.log(`BNB price: $${price}`);
            
            // Update cache
            priceCache.bnb = {
              price,
              lastUpdated: now
            };
            
            resolve(price);
          } else {
            const error = new Error('Invalid BNB price response from local service');
            console.error(error.message, response);
            
            // If we have a cached price, use it
            if (priceCache.bnb.price > 0) {
              console.log('Using cached BNB price due to API error');
              resolve(priceCache.bnb.price);
            } else {
              reject(error);
            }
          }
        } catch (error) {
          console.error('Error parsing BNB price from local service:', error);
          
          // If we have a cached price, use it
          if (priceCache.bnb.price > 0) {
            console.log('Using cached BNB price due to parse error');
            resolve(priceCache.bnb.price);
          } else {
            reject(error);
          }
        }
      });
    });
    
    request.on('error', (err) => {
      console.error('Error fetching BNB price from local service:', err);
      
      // If we have a cached price, use it
      if (priceCache.bnb.price > 0) {
        console.log('Using cached BNB price due to network error');
        resolve(priceCache.bnb.price);
      } else {
        reject(err);
      }
    });
    
    // Set a timeout to avoid hanging requests
    request.setTimeout(10000, () => {
      request.destroy();
      const timeoutError = new Error('Request timeout while fetching BNB price');
      console.error(timeoutError.message);
      
      if (priceCache.bnb.price > 0) {
        console.log('Using cached BNB price due to timeout');
        resolve(priceCache.bnb.price);
      } else {
        reject(timeoutError);
      }
    });
  });
}

// Function to get token price from local service
async function getTokenPriceUsd(tokenAddress) {
  // Check if we have a recent cache (less than 5 minutes old)
  const now = Date.now();
  if (priceCache.tokens[tokenAddress] && 
      priceCache.tokens[tokenAddress].price > 0 && 
      (now - priceCache.tokens[tokenAddress].lastUpdated) < 5 * 60 * 1000) {
    return priceCache.tokens[tokenAddress].price;
  }
  
  return new Promise((resolve, reject) => {
    // Use local CoinGecko service instead of calling CoinGecko directly
    const url = `http://localhost:4053/api/token-price?address=${tokenAddress}`;
    
    const request = http.get(url, (resp) => {
      // Check for valid response status code
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        return reject(new Error(`Status Code: ${resp.statusCode}`));
      }
      
      let data = '';
      
      resp.on('data', (chunk) => {
        data += chunk;
      });
      
      resp.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response && response.success && response.price) {
            const price = parseFloat(response.price);
            console.log(`Token price for ${tokenAddress}: $${price}`);
            
            // Update cache
            priceCache.tokens[tokenAddress] = {
              price,
              lastUpdated: now
            };
            
            resolve(price);
          } else {
            const error = new Error('Invalid token price response from local service');
            console.error(error.message, response);
            
            // If we have a cached price, use it
            if (priceCache.tokens[tokenAddress] && priceCache.tokens[tokenAddress].price > 0) {
              console.log('Using cached token price due to API error');
              resolve(priceCache.tokens[tokenAddress].price);
            } else {
              reject(error);
            }
          }
        } catch (error) {
          console.error('Error parsing token price from local service:', error);
          
          // If we have a cached price, use it
          if (priceCache.tokens[tokenAddress] && priceCache.tokens[tokenAddress].price > 0) {
            console.log('Using cached token price due to parse error');
            resolve(priceCache.tokens[tokenAddress].price);
          } else {
            reject(error);
          }
        }
      });
    });
    
    request.on('error', (err) => {
      console.error('Error fetching token price from local service:', err);
      
      // If we have a cached price, use it
      if (priceCache.tokens[tokenAddress] && priceCache.tokens[tokenAddress].price > 0) {
        console.log('Using cached token price due to network error');
        resolve(priceCache.tokens[tokenAddress].price);
      } else {
        reject(err);
      }
    });
    
    // Set a timeout to avoid hanging requests
    request.setTimeout(10000, () => {
      request.destroy();
      const timeoutError = new Error('Request timeout while fetching token price');
      console.error(timeoutError.message);
      
      if (priceCache.tokens[tokenAddress] && priceCache.tokens[tokenAddress].price > 0) {
        console.log('Using cached token price due to timeout');
        resolve(priceCache.tokens[tokenAddress].price);
      } else {
        reject(timeoutError);
      }
    });
  });
}

// API Routes
app.post('/api/config', (req, res) => {
  const { tokenAddress, usdAmount, slippage, interval, mode } = req.body;
  
  if (tokenAddress && usdAmount && slippage && interval && mode) {
    botConfig = { tokenAddress, usdAmount, slippage, interval, mode };
    res.json({ success: true, message: 'Configuration updated', config: botConfig });
  } else {
    res.status(400).json({ success: false, message: 'Missing required parameters' });
  }
});

app.post('/api/wallet', (req, res) => {
  const { privateKey } = req.body;
  
  if (!privateKey) {
    return res.status(400).json({ success: false, message: 'Private key is required' });
  }
  
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const walletInfo = {
      id: Date.now().toString(),
      address: wallet.address,
      privateKey,
      status: 'inactive',
      transactions: 0,
      lastAction: 'Added to system',
      isActive: false
    };
    
    wallets.push(walletInfo);
    res.json({ success: true, wallet: { ...walletInfo, privateKey: undefined } });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid private key' });
  }
});

app.delete('/api/wallet/:id', (req, res) => {
  const { id } = req.params;
  const walletIndex = wallets.findIndex(w => w.id === id);
  
  if (walletIndex === -1) {
    return res.status(404).json({ success: false, message: 'Wallet not found' });
  }
  
  // Stop the bot if running
  if (botIntervals[id]) {
    clearInterval(botIntervals[id]);
    delete botIntervals[id];
  }
  
  wallets.splice(walletIndex, 1);
  res.json({ success: true, message: 'Wallet removed' });
});

app.post('/api/wallet/:id/toggle', (req, res) => {
  const { id } = req.params;
  const wallet = wallets.find(w => w.id === id);
  
  if (!wallet) {
    return res.status(404).json({ success: false, message: 'Wallet not found' });
  }
  
  if (wallet.isActive) {
    // Stop bot
    if (botIntervals[id]) {
      clearInterval(botIntervals[id]);
      delete botIntervals[id];
    }
    wallet.isActive = false;
    wallet.status = 'inactive';
    wallet.lastAction = 'Bot stopped';
    res.json({ success: true, message: 'Bot stopped', wallet: { ...wallet, privateKey: undefined } });
  } else {
    // Start bot
    if (!botConfig.tokenAddress) {
      return res.status(400).json({ success: false, message: 'Token address is required' });
    }
    
    startBot(wallet);
    res.json({ success: true, message: 'Bot started', wallet: { ...wallet, privateKey: undefined } });
  }
});

app.post('/api/start-all', (req, res) => {
  if (wallets.length === 0) {
    return res.status(400).json({ success: false, message: 'No wallets added' });
  }
  
  if (!botConfig.tokenAddress) {
    return res.status(400).json({ success: false, message: 'Token address is required' });
  }
  
  let startedCount = 0;
  wallets.forEach(wallet => {
    if (!wallet.isActive) {
      startBot(wallet);
      startedCount++;
    }
  });
  
  res.json({ success: true, message: `Started ${startedCount} bots` });
});

app.post('/api/stop-all', (req, res) => {
  wallets.forEach(wallet => {
    if (wallet.isActive && botIntervals[wallet.id]) {
      clearInterval(botIntervals[wallet.id]);
      delete botIntervals[wallet.id];
      wallet.isActive = false;
      wallet.status = 'inactive';
      wallet.lastAction = 'Bot stopped';
    }
  });
  
  res.json({ success: true, message: 'All bots stopped' });
});

app.get('/api/wallets', (req, res) => {
  const sanitizedWallets = wallets.map(wallet => ({
    ...wallet,
    privateKey: undefined
  }));
  
  res.json({ success: true, wallets: sanitizedWallets });
});

app.get('/api/config', (req, res) => {
  res.json({ success: true, config: botConfig });
});

app.get('/api/bnb-price', async (req, res) => {
  try {
    const price = await getBnbPriceUsd();
    res.json({ success: true, price });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get BNB price' });
  }
});

app.get('/api/token-price', async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ success: false, message: 'Token address is required' });
  }
  
  try {
    const price = await getTokenPriceUsd(address);
    res.json({ success: true, price });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get token price' });
  }
});

// Trading Bot Functions
async function buyToken(wallet) {
  try {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, ROUTER_ABI, walletInstance);
    
    // Get current BNB price in USD
    const bnbPrice = await getBnbPriceUsd();
    
    // Convert USD to BNB
    const bnbAmount = parseFloat(botConfig.usdAmount) / bnbPrice;
    console.log(`Buy: Converting $${botConfig.usdAmount} to ${bnbAmount.toFixed(6)} BNB at price $${bnbPrice}`);
    
    const bnbAmountWei = ethers.utils.parseEther(bnbAmount.toString());
    
    const path = [WBNB_ADDRESS, botConfig.tokenAddress];
    
    // Get expected output
    const amounts = await router.getAmountsOut(bnbAmountWei, path);
    const amountOutMin = amounts[1].mul(100 - parseInt(botConfig.slippage)).div(100);
    
    // Execute swap
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      walletInstance.address,
      deadline,
      { value: bnbAmountWei, gasLimit: 300000 }
    );
    
    const receipt = await tx.wait();
    
    const walletIndex = wallets.findIndex(w => w.id === wallet.id);
    if (walletIndex !== -1) {
      wallets[walletIndex].transactions++;
      wallets[walletIndex].lastAction = `Buy successful: ${tx.hash.substring(0, 10)}...`;
    }
    
    return true;
  } catch (error) {
    console.error(`Buy error for wallet ${wallet.address}: ${error.message}`);
    
    const walletIndex = wallets.findIndex(w => w.id === wallet.id);
    if (walletIndex !== -1) {
      wallets[walletIndex].lastAction = `Buy failed: ${error.message.substring(0, 30)}...`;
    }
    
    return false;
  }
}

async function sellToken(wallet) {
  try {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, ROUTER_ABI, walletInstance);
    const tokenContract = new ethers.Contract(botConfig.tokenAddress, ERC20_ABI, walletInstance);
    
    // Get token balance and approve router
    const tokenBalance = await tokenContract.balanceOf(walletInstance.address);
    if (tokenBalance.eq(0)) {
      throw new Error('No tokens to sell');
    }
    
    await tokenContract.approve(PANCAKESWAP_ROUTER_ADDRESS, tokenBalance);
    
    // Get expected output
    const path = [botConfig.tokenAddress, WBNB_ADDRESS];
    const amounts = await router.getAmountsOut(tokenBalance, path);
    const amountOutMin = amounts[1].mul(100 - parseInt(botConfig.slippage)).div(100);
    
    // Execute swap
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const tx = await router.swapExactTokensForETH(
      tokenBalance,
      amountOutMin,
      path,
      walletInstance.address,
      deadline,
      { gasLimit: 300000 }
    );
    
    const receipt = await tx.wait();
    
    const walletIndex = wallets.findIndex(w => w.id === wallet.id);
    if (walletIndex !== -1) {
      wallets[walletIndex].transactions++;
      wallets[walletIndex].lastAction = `Sell successful: ${tx.hash.substring(0, 10)}...`;
    }
    
    return true;
  } catch (error) {
    console.error(`Sell error for wallet ${wallet.address}: ${error.message}`);
    
    const walletIndex = wallets.findIndex(w => w.id === wallet.id);
    if (walletIndex !== -1) {
      wallets[walletIndex].lastAction = `Sell failed: ${error.message.substring(0, 30)}...`;
    }
    
    return false;
  }
}

function startBot(wallet) {
  // Stop existing bot if running
  if (botIntervals[wallet.id]) {
    clearInterval(botIntervals[wallet.id]);
    delete botIntervals[wallet.id];
  }
  
  wallet.isActive = true;
  wallet.status = 'active';
  wallet.lastAction = 'Bot started';
  
  // Create a function to run one trade cycle
  const executeTradesCycle = async () => {
    const walletIndex = wallets.findIndex(w => w.id === wallet.id);
    if (walletIndex === -1) {
      if (botIntervals[wallet.id]) {
        clearInterval(botIntervals[wallet.id]);
        delete botIntervals[wallet.id];
      }
      return;
    }
    
    const currentWallet = wallets[walletIndex];
    
    try {
      // Try to get BNB price first before executing trades
      const bnbPrice = await getBnbPriceUsd().catch(err => {
        console.error('Error fetching BNB price:', err);
        const idx = wallets.findIndex(w => w.id === currentWallet.id);
        if (idx !== -1) {
          wallets[idx].lastAction = 'Error fetching BNB price, skipping trade cycle';
        }
        // Return 0 to indicate price fetch failed
        return 0;
      });
      
      // Skip this trade cycle if price fetch failed
      if (!bnbPrice) {
        return;
      }
      
      if (botConfig.mode === 'buy') {
        await buyToken(currentWallet);
      } 
      else if (botConfig.mode === 'sell') {
        await sellToken(currentWallet);
      }
      else if (botConfig.mode === 'both') {
        // First execute buy
        const buyResult = await buyToken(currentWallet);
        
        // Update wallet status to indicate waiting
        const walletIdx = wallets.findIndex(w => w.id === currentWallet.id);
        if (walletIdx !== -1) {
          wallets[walletIdx].lastAction = 'Waiting 60 seconds before selling...';
        }
        
        // Wait 60 seconds before selling
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        
        // Check if the bot is still active before selling
        const updatedWalletIndex = wallets.findIndex(w => w.id === currentWallet.id);
        if (updatedWalletIndex !== -1 && wallets[updatedWalletIndex].isActive) {
          await sellToken(wallets[updatedWalletIndex]);
        }
      }
    } catch (error) {
      console.error(`Bot error for wallet ${currentWallet.address}: ${error.message}`);
      const walletIdx = wallets.findIndex(w => w.id === currentWallet.id);
      if (walletIdx !== -1) {
        wallets[walletIdx].lastAction = `Error: ${error.message.substring(0, 30)}...`;
      }
    }
  };
  
  // Execute the first cycle immediately
  executeTradesCycle();
  
  // Set up a timeout to run the cycles at the configured interval
  const intervalMs = parseInt(botConfig.interval) * 60 * 1000; // minutes to ms
  
  botIntervals[wallet.id] = setInterval(executeTradesCycle, intervalMs);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 