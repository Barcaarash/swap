/**
 * Utility functions for Hot Swap Bot
 */
const Utils = {
  /**
   * Debounce function to limit how often a function can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Milliseconds to wait
   * @returns {Function} - Debounced function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  },
  
  /**
   * Throttle function to limit how often a function can be called
   * @param {Function} func - Function to throttle
   * @param {number} limit - Milliseconds to limit
   * @returns {Function} - Throttled function
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },
  
  /**
   * Format number with thousands separators
   * @param {number} num - Number to format
   * @returns {string} - Formatted number
   */
  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  },
  
  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean} - Whether address is valid
   */
  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} length - Maximum length
   * @returns {string} - Truncated string
   */
  truncate(str, length = 20) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },
  
  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date
   */
  formatDate(date, options = {}) {
    if (!date) return '';
    const defaultOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
  },
  
  /**
   * Get query parameters from URL
   * @returns {Object} - Object with query parameters
   */
  getQueryParams() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Whether copy was successful
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },
  
  /**
   * Generate random ID
   * @param {number} length - ID length
   * @returns {string} - Random ID
   */
  generateId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  /**
   * Wait for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}; 