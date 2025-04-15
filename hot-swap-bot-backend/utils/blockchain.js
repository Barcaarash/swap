const { ethers } = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./logger');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// PancakeSwap Router ABI (minimal)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// ERC20 Token ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

// WBNB address on BSC
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// Provider setup
const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL);
};

// Router contract setup
const getRouter = (signerOrProvider) => {
  return new ethers.Contract(
    process.env.PANCAKESWAP_ROUTER_ADDRESS,
    ROUTER_ABI,
    signerOrProvider
  );
};

// Get token contract
const getTokenContract = (tokenAddress, signerOrProvider) => {
  return new ethers.Contract(
    tokenAddress,
    ERC20_ABI,
    signerOrProvider
  );
};

// Get wallet from private key
const getWalletFromPrivateKey = (privateKey) => {
  try {
    const provider = getProvider();
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    logger.error(`Failed to create wallet: ${error.message}`);
    throw new Error('Invalid private key');
  }
};

// Get token price in BNB
const getTokenPriceInBNB = async (tokenAddress) => {
  try {
    const provider = getProvider();
    const router = getRouter(provider);
    
    // amountIn = 1 token (considering token decimals)
    const tokenContract = getTokenContract(tokenAddress, provider);
    const decimals = await tokenContract.decimals();
    const amountIn = ethers.utils.parseUnits('1', decimals);
    
    // Path for the swap
    const path = [tokenAddress, WBNB_ADDRESS];
    
    // Get amounts out
    const amounts = await router.getAmountsOut(amountIn, path);
    
    // Return BNB value
    return ethers.utils.formatEther(amounts[1]);
  } catch (error) {
    logger.error(`Failed to get token price: ${error.message}`);
    throw error;
  }
};

// Get BNB price in token
const getBNBPriceInToken = async (tokenAddress) => {
  try {
    const provider = getProvider();
    const router = getRouter(provider);
    
    // amountIn = 1 BNB
    const amountIn = ethers.utils.parseEther('1');
    
    // Path for the swap
    const path = [WBNB_ADDRESS, tokenAddress];
    
    // Get amounts out
    const amounts = await router.getAmountsOut(amountIn, path);
    
    // Get token decimals
    const tokenContract = getTokenContract(tokenAddress, provider);
    const decimals = await tokenContract.decimals();
    
    // Return token value
    return ethers.utils.formatUnits(amounts[1], decimals);
  } catch (error) {
    logger.error(`Failed to get BNB price: ${error.message}`);
    throw error;
  }
};

// Swap BNB for tokens
const swapBNBForTokens = async (privateKey, tokenAddress, bnbAmount, slippageTolerance) => {
  try {
    const wallet = getWalletFromPrivateKey(privateKey);
    const router = getRouter(wallet);
    
    // Convert BNB amount to Wei
    const bnbAmountWei = ethers.utils.parseEther(bnbAmount.toString());
    
    // Get expected output using getAmountsOut
    const path = [WBNB_ADDRESS, tokenAddress];
    const amounts = await router.getAmountsOut(bnbAmountWei, path);
    
    // Calculate minimum amount out based on slippage tolerance
    const slippageMultiplier = (100 - slippageTolerance) / 100;
    const minAmountOut = amounts[1].mul(Math.floor(slippageMultiplier * 1000)).div(1000);
    
    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
    
    // Execute swap
    const tx = await router.swapExactETHForTokens(
      minAmountOut,
      path,
      wallet.address,
      deadline,
      { value: bnbAmountWei, gasLimit: 500000 }
    );
    
    logger.info(`Swap BNB for tokens tx sent: ${tx.hash}`);
    
    // Wait for transaction to be confirmed
    const receipt = await tx.wait();
    
    logger.info(`Swap BNB for tokens confirmed: ${receipt.transactionHash}`);
    return receipt;
  } catch (error) {
    logger.error(`Swap BNB for tokens failed: ${error.message}`);
    throw error;
  }
};

// Swap tokens for BNB
const swapTokensForBNB = async (privateKey, tokenAddress, tokenAmount, slippageTolerance) => {
  try {
    const wallet = getWalletFromPrivateKey(privateKey);
    const router = getRouter(wallet);
    const tokenContract = getTokenContract(tokenAddress, wallet);
    
    // Get token decimals
    const decimals = await tokenContract.decimals();
    
    // Convert token amount to Wei-equivalent
    const tokenAmountWei = ethers.utils.parseUnits(tokenAmount.toString(), decimals);
    
    // Approve router to spend tokens
    const approveTx = await tokenContract.approve(
      process.env.PANCAKESWAP_ROUTER_ADDRESS,
      tokenAmountWei,
      { gasLimit: 300000 }
    );
    
    logger.info(`Token approval tx sent: ${approveTx.hash}`);
    await approveTx.wait();
    logger.info('Token approval confirmed');
    
    // Get expected output using getAmountsOut
    const path = [tokenAddress, WBNB_ADDRESS];
    const amounts = await router.getAmountsOut(tokenAmountWei, path);
    
    // Calculate minimum amount out based on slippage tolerance
    const slippageMultiplier = (100 - slippageTolerance) / 100;
    const minAmountOut = amounts[1].mul(Math.floor(slippageMultiplier * 1000)).div(1000);
    
    // Set deadline to 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
    
    // Execute swap
    const tx = await router.swapExactTokensForETH(
      tokenAmountWei,
      minAmountOut,
      path,
      wallet.address,
      deadline,
      { gasLimit: 500000 }
    );
    
    logger.info(`Swap tokens for BNB tx sent: ${tx.hash}`);
    
    // Wait for transaction to be confirmed
    const receipt = await tx.wait();
    
    logger.info(`Swap tokens for BNB confirmed: ${receipt.transactionHash}`);
    return receipt;
  } catch (error) {
    logger.error(`Swap tokens for BNB failed: ${error.message}`);
    throw error;
  }
};

// Get BNB balance for a wallet
const getBNBBalance = async (walletAddress) => {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(walletAddress);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    logger.error(`Failed to get BNB balance: ${error.message}`);
    throw error;
  }
};

// Get token balance for a wallet
const getTokenBalance = async (walletAddress, tokenAddress) => {
  try {
    const provider = getProvider();
    const tokenContract = getTokenContract(tokenAddress, provider);
    
    // Get decimals
    const decimals = await tokenContract.decimals();
    
    // Get balance
    const balance = await tokenContract.balanceOf(walletAddress);
    
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    logger.error(`Failed to get token balance: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getProvider,
  getRouter,
  getTokenContract,
  getWalletFromPrivateKey,
  getTokenPriceInBNB,
  getBNBPriceInToken,
  swapBNBForTokens,
  swapTokensForBNB,
  getBNBBalance,
  getTokenBalance,
  WBNB_ADDRESS
}; 