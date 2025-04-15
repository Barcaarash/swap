/**
 * UI utilities for Hot Swap Bot
 */
const UI = {
  /**
   * Initialize UI components
   */
  init() {
    console.log('UI module initialized');
  },
  
  /**
   * Show a loading indicator
   */
  showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    loadingOverlay.id = 'loadingOverlay';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center';
    loadingSpinner.innerHTML = `
      <div class="loading-spinner w-12 h-12 border-4 mb-4"></div>
      <p class="text-white">Loading...</p>
    `;
    
    loadingOverlay.appendChild(loadingSpinner);
    document.body.appendChild(loadingOverlay);
  },
  
  /**
   * Hide the loading indicator
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  },
  
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type (success, error, warning, info)
   */
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle mr-2"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
        break;
      case 'info':
      default:
        icon = '<i class="fas fa-info-circle mr-2"></i>';
        break;
    }
    
    toast.innerHTML = `
      ${icon}${message}
      <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after animation completes
    setTimeout(() => {
      toast.remove();
    }, 4000);
  },
  
  /**
   * Show a modal
   * @param {string} modalId - ID of the modal to show
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    }
  },
  
  /**
   * Hide a modal
   * @param {string} modalId - ID of the modal to hide
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  },
  
  /**
   * Show confirmation modal
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback to execute on confirmation
   */
  showConfirmation(message, onConfirm) {
    const confirmationMessage = document.getElementById('confirmationMessage');
    const confirmAction = document.getElementById('confirmAction');
    
    // Set message
    confirmationMessage.textContent = message;
    
    // Set confirm action
    confirmAction.onclick = () => {
      onConfirm();
      this.hideModal('confirmationModal');
    };
    
    // Show modal
    this.showModal('confirmationModal');
  },
  
  /**
   * Format address for display (truncate)
   * @param {string} address - Wallet address
   * @returns {string} - Formatted address
   */
  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  },
  
  /**
   * Format number with specified decimals
   * @param {number} value - Number to format
   * @param {number} decimals - Decimal places
   * @returns {string} - Formatted number
   */
  formatNumber(value, decimals = 4) {
    if (value === null || value === undefined) return '-';
    return parseFloat(value).toFixed(decimals);
  },
  
  /**
   * Format currency for display
   * @param {number} value - Currency value
   * @returns {string} - Formatted currency
   */
  formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return `$${parseFloat(value).toFixed(4)}`;
  },
  
  /**
   * Format relative time (e.g., "3m ago")
   * @param {string} timestamp - ISO timestamp
   * @returns {string} - Relative time
   */
  formatRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  },
  
  /**
   * Add loading state to an element
   * @param {Element} element - Element to add loading state to
   */
  addLoadingState(element) {
    element.classList.add('loading');
  },
  
  /**
   * Remove loading state from an element
   * @param {Element} element - Element to remove loading state from
   */
  removeLoadingState(element) {
    element.classList.remove('loading');
  }
}; 