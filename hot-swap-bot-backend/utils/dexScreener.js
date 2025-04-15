const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('./logger');

/**
 * Scrape token price data from DexScreener without API key
 * @param {string} tokenAddress - The token address to check
 * @param {string} chain - The blockchain (default: 'bsc')
 * @returns {Object} - Price data object
 */
const scrapeTokenPrice = async (tokenAddress, chain = 'bsc') => {
  try {
    const url = `https://dexscreener.com/${chain}/${tokenAddress}`;
    
    logger.info(`Scraping price data from ${url}`);
    
    // Use axios to fetch the HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    });
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Find price data
    const priceText = $('div:contains("Price")').next().text();
    const priceUSDText = $('div:contains("Price USD")').next().text();
    
    // Extract price values
    const price = extractPrice(priceText);
    const priceUSD = extractPrice(priceUSDText);
    
    // Find tokens liquidity data
    const liquidityText = $('div:contains("Liquidity")').next().text();
    const liquidity = extractPrice(liquidityText);
    
    // Extract volume data
    const h24VolumeText = $('div:contains("24h Volume")').next().text();
    const h24Volume = extractPrice(h24VolumeText);
    
    // Extract market cap if available
    const marketCapText = $('div:contains("FDV")').next().text();
    const marketCap = extractPrice(marketCapText);
    
    // Get token name and symbol
    const titleText = $('title').text();
    const [symbol, name] = extractTokenInfo(titleText);
    
    return {
      success: true,
      data: {
        name,
        symbol,
        price,
        priceUSD,
        liquidity,
        h24Volume,
        marketCap,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error(`Failed to scrape token price: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper function to extract numeric price from text
 * @param {string} text - Text containing price
 * @returns {number|null} - Extracted price or null
 */
const extractPrice = (text) => {
  if (!text) return null;
  
  // Remove $ symbol and any other non-numeric chars except dots and commas
  const cleanText = text.replace(/[^0-9.,]/g, '');
  
  // Replace commas with dots if necessary
  const normalizedText = cleanText.replace(/,/g, '.');
  
  // If multiple dots, keep only the first one
  const parts = normalizedText.split('.');
  if (parts.length > 2) {
    const integerPart = parts[0];
    const decimalPart = parts.slice(1).join('');
    return parseFloat(`${integerPart}.${decimalPart}`);
  }
  
  return parseFloat(normalizedText);
};

/**
 * Helper function to extract token info from page title
 * @param {string} titleText - Page title
 * @returns {Array} - [symbol, name]
 */
const extractTokenInfo = (titleText) => {
  // Expected format: "SYMBOL Price Chart | TOKEN NAME price, Marketcap, Exchange"
  if (!titleText) return ['Unknown', 'Unknown'];
  
  const parts = titleText.split('|');
  if (parts.length < 2) return ['Unknown', 'Unknown'];
  
  const symbolPart = parts[0].trim();
  const namePart = parts[1].trim();
  
  // Extract symbol
  const symbol = symbolPart.replace(' Price Chart', '').trim();
  
  // Extract name
  const nameMatch = namePart.match(/^(.*?) price/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
  
  return [symbol, name];
};

/**
 * Try multiple retries to get token price data
 * @param {string} tokenAddress - The token address
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Object} - Price data
 */
const getTokenPriceWithRetry = async (tokenAddress, maxRetries = 3) => {
  let retries = 0;
  let result = null;
  
  while (retries < maxRetries) {
    result = await scrapeTokenPrice(tokenAddress);
    
    if (result.success) {
      return result;
    }
    
    retries++;
    logger.warn(`Retry ${retries}/${maxRetries} for token ${tokenAddress}`);
    
    // Wait before next retry (500ms, 1000ms, 2000ms)
    await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries - 1)));
  }
  
  return result;
};

module.exports = {
  scrapeTokenPrice,
  getTokenPriceWithRetry
}; 